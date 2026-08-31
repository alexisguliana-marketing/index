-- Performance fixes from the Supabase advisor, run after provisioning the
-- first real project (a Postgres-hosted feature, not caught by the local
-- Postgres reproduction used until now — see PROJECT_STATUS.md).
--
-- Two families of finding, both affecting write-heavy tables at scale:
--
-- 1. auth_rls_initplan (WARN, ~35 policies): a bare `auth.uid()` inside a
--    policy's USING/CHECK is re-evaluated once per row scanned. Wrapping it
--    as `(select auth.uid())` lets Postgres treat it as an initplan —
--    evaluated once per statement instead. Calls to this schema's own
--    helper functions (`is_wedding_member`, `current_wedding_role`,
--    `owns_vendor`, `is_conversation_member`) are NOT touched: they take a
--    per-row-varying argument (e.g. `wedding_id`), so the function call
--    itself can't be hoisted regardless of what's inside it — only bare
--    `auth.uid()` references benefit from the rewrite.
--
-- 2. multiple_permissive_policies (WARN, 8 tables): each of these tables had
--    a broad "members/public read" SELECT policy *and* a "for all" manage
--    policy from certain roles — Postgres must OR both together on every
--    SELECT even though the manage policy never added new rows a member
--    couldn't already see. Splitting "for all" into separate INSERT/UPDATE/
--    DELETE policies keeps the exact same effective permissions while
--    leaving SELECT covered by a single policy.

-- ─── Profiles ────────────────────────────────────────────────────────────
drop policy "users manage their own profile" on public.profiles;
create policy "users manage their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- ─── Weddings & members ─────────────────────────────────────────────────
drop policy "authenticated users create their own wedding" on public.weddings;
create policy "authenticated users create their own wedding"
  on public.weddings for insert
  to authenticated
  with check (created_by = (select auth.uid()));

drop policy "members read the member roster" on public.wedding_members;
create policy "members read the member roster"
  on public.wedding_members for select
  to authenticated
  using (public.is_wedding_member(wedding_id) or user_id = (select auth.uid()));

drop policy "admins remove members, members remove themselves" on public.wedding_members;
create policy "admins remove members, members remove themselves"
  on public.wedding_members for delete
  to authenticated
  using (public.current_wedding_role(wedding_id) = 'admin' or user_id = (select auth.uid()));

-- ─── Tasks (§10) — split "for all" to stop doubling up with the read policy
drop policy "admins planners witnesses manage tasks" on public.tasks;
create policy "admins planners witnesses insert tasks"
  on public.tasks for insert
  to authenticated
  with check (public.current_wedding_role(wedding_id) in ('admin', 'planner', 'witness'));
create policy "admins planners witnesses update tasks"
  on public.tasks for update
  to authenticated
  using (public.current_wedding_role(wedding_id) in ('admin', 'planner', 'witness'))
  with check (public.current_wedding_role(wedding_id) in ('admin', 'planner', 'witness'));
create policy "admins planners witnesses delete tasks"
  on public.tasks for delete
  to authenticated
  using (public.current_wedding_role(wedding_id) in ('admin', 'planner', 'witness'));

-- ─── Budget items (§10) ─────────────────────────────────────────────────
drop policy "admins and planners manage budget items" on public.budget_items;
create policy "admins and planners insert budget items"
  on public.budget_items for insert
  to authenticated
  with check (public.current_wedding_role(wedding_id) in ('admin', 'planner'));
create policy "admins and planners update budget items"
  on public.budget_items for update
  to authenticated
  using (public.current_wedding_role(wedding_id) in ('admin', 'planner'))
  with check (public.current_wedding_role(wedding_id) in ('admin', 'planner'));
create policy "admins and planners delete budget items"
  on public.budget_items for delete
  to authenticated
  using (public.current_wedding_role(wedding_id) in ('admin', 'planner'));

-- ─── Guests (§10) ───────────────────────────────────────────────────────
drop policy "admins planners guest managers manage guests" on public.guests;
create policy "admins planners guest managers insert guests"
  on public.guests for insert
  to authenticated
  with check (public.current_wedding_role(wedding_id) in ('admin', 'planner', 'guest_manager'));
create policy "admins planners guest managers update guests"
  on public.guests for update
  to authenticated
  using (public.current_wedding_role(wedding_id) in ('admin', 'planner', 'guest_manager'))
  with check (public.current_wedding_role(wedding_id) in ('admin', 'planner', 'guest_manager'));
create policy "admins planners guest managers delete guests"
  on public.guests for delete
  to authenticated
  using (public.current_wedding_role(wedding_id) in ('admin', 'planner', 'guest_manager'));

-- ─── Vendors ─────────────────────────────────────────────────────────────
drop policy "published vendors are public, owners see their own drafts" on public.vendors;
create policy "published vendors are public, owners see their own drafts"
  on public.vendors for select
  to authenticated, anon
  using (is_published or owner_user_id = (select auth.uid()));

drop policy "a user creates their own vendor profile" on public.vendors;
create policy "a user creates their own vendor profile"
  on public.vendors for insert
  to authenticated
  with check (owner_user_id = (select auth.uid()));

drop policy "owners manage their vendor profile" on public.vendors;
create policy "owners manage their vendor profile"
  on public.vendors for update
  to authenticated
  using (owner_user_id = (select auth.uid()))
  with check (owner_user_id = (select auth.uid()));

drop policy "owners delete their vendor profile" on public.vendors;
create policy "owners delete their vendor profile"
  on public.vendors for delete
  to authenticated
  using (owner_user_id = (select auth.uid()));

-- ─── Vendor category assignments ────────────────────────────────────────
drop policy "published vendor category tags are public" on public.vendor_category_assignments;
create policy "published vendor category tags are public"
  on public.vendor_category_assignments for select
  to authenticated, anon
  using (exists (
    select 1 from public.vendors v
    where v.id = vendor_id and (v.is_published or v.owner_user_id = (select auth.uid()))
  ));

drop policy "owners manage their category tags" on public.vendor_category_assignments;
create policy "owners insert their category tags"
  on public.vendor_category_assignments for insert
  to authenticated
  with check (public.owns_vendor(vendor_id));
create policy "owners delete their category tags"
  on public.vendor_category_assignments for delete
  to authenticated
  using (public.owns_vendor(vendor_id));

-- ─── Vendor services ────────────────────────────────────────────────────
drop policy "published vendor services are public" on public.vendor_services;
create policy "published vendor services are public"
  on public.vendor_services for select
  to authenticated, anon
  using (exists (
    select 1 from public.vendors v
    where v.id = vendor_id and (v.is_published or v.owner_user_id = (select auth.uid()))
  ));

drop policy "owners manage their services" on public.vendor_services;
create policy "owners insert their services"
  on public.vendor_services for insert
  to authenticated
  with check (public.owns_vendor(vendor_id));
create policy "owners update their services"
  on public.vendor_services for update
  to authenticated
  using (public.owns_vendor(vendor_id))
  with check (public.owns_vendor(vendor_id));
create policy "owners delete their services"
  on public.vendor_services for delete
  to authenticated
  using (public.owns_vendor(vendor_id));

-- ─── Vendor locations ───────────────────────────────────────────────────
drop policy "published vendor locations are public" on public.vendor_locations;
create policy "published vendor locations are public"
  on public.vendor_locations for select
  to authenticated, anon
  using (exists (
    select 1 from public.vendors v
    where v.id = vendor_id and (v.is_published or v.owner_user_id = (select auth.uid()))
  ));

drop policy "owners manage their locations" on public.vendor_locations;
create policy "owners insert their locations"
  on public.vendor_locations for insert
  to authenticated
  with check (public.owns_vendor(vendor_id));
create policy "owners update their locations"
  on public.vendor_locations for update
  to authenticated
  using (public.owns_vendor(vendor_id))
  with check (public.owns_vendor(vendor_id));
create policy "owners delete their locations"
  on public.vendor_locations for delete
  to authenticated
  using (public.owns_vendor(vendor_id));

-- ─── Vendor availability ────────────────────────────────────────────────
drop policy "published vendor availability is public" on public.vendor_availability;
create policy "published vendor availability is public"
  on public.vendor_availability for select
  to authenticated, anon
  using (exists (
    select 1 from public.vendors v
    where v.id = vendor_id and (v.is_published or v.owner_user_id = (select auth.uid()))
  ));

drop policy "owners manage their availability" on public.vendor_availability;
create policy "owners insert their availability"
  on public.vendor_availability for insert
  to authenticated
  with check (public.owns_vendor(vendor_id));
create policy "owners update their availability"
  on public.vendor_availability for update
  to authenticated
  using (public.owns_vendor(vendor_id))
  with check (public.owns_vendor(vendor_id));
create policy "owners delete their availability"
  on public.vendor_availability for delete
  to authenticated
  using (public.owns_vendor(vendor_id));

-- ─── Vendor portfolio items ─────────────────────────────────────────────
drop policy "published vendor portfolio is public" on public.vendor_portfolio_items;
create policy "published vendor portfolio is public"
  on public.vendor_portfolio_items for select
  to authenticated, anon
  using (exists (
    select 1 from public.vendors v
    where v.id = vendor_id and (v.is_published or v.owner_user_id = (select auth.uid()))
  ));

drop policy "owners manage their portfolio" on public.vendor_portfolio_items;
create policy "owners insert their portfolio"
  on public.vendor_portfolio_items for insert
  to authenticated
  with check (public.owns_vendor(vendor_id));
create policy "owners update their portfolio"
  on public.vendor_portfolio_items for update
  to authenticated
  using (public.owns_vendor(vendor_id))
  with check (public.owns_vendor(vendor_id));
create policy "owners delete their portfolio"
  on public.vendor_portfolio_items for delete
  to authenticated
  using (public.owns_vendor(vendor_id));

-- ─── Vendor reviews ─────────────────────────────────────────────────────
drop policy "published vendor reviews are public" on public.vendor_reviews;
create policy "published vendor reviews are public"
  on public.vendor_reviews for select
  to authenticated, anon
  using (exists (
    select 1 from public.vendors v
    where v.id = vendor_id and (v.is_published or v.owner_user_id = (select auth.uid()))
  ));

drop policy "wedding members leave a review" on public.vendor_reviews;
create policy "wedding members leave a review"
  on public.vendor_reviews for insert
  to authenticated
  with check (author_user_id = (select auth.uid()) and public.is_wedding_member(wedding_id));

drop policy "authors manage their own review" on public.vendor_reviews;
create policy "authors manage their own review"
  on public.vendor_reviews for update
  to authenticated
  using (author_user_id = (select auth.uid()))
  with check (author_user_id = (select auth.uid()));

drop policy "authors delete their own review" on public.vendor_reviews;
create policy "authors delete their own review"
  on public.vendor_reviews for delete
  to authenticated
  using (author_user_id = (select auth.uid()));

-- ─── Media ──────────────────────────────────────────────────────────────
drop policy "media is visible with its wedding or vendor context" on public.media;
create policy "media is visible with its wedding or vendor context"
  on public.media for select
  to authenticated, anon
  using (
    (wedding_id is not null and (
      public.is_wedding_member(wedding_id)
      or exists (select 1 from public.weddings w where w.id = wedding_id and w.is_public)
    ))
    or (vendor_id is not null and exists (
      select 1 from public.vendors v where v.id = vendor_id and (v.is_published or v.owner_user_id = (select auth.uid()))
    ))
    or (wedding_id is null and vendor_id is null and uploaded_by_user_id = (select auth.uid()))
  );

drop policy "authenticated users upload media they own" on public.media;
create policy "authenticated users upload media they own"
  on public.media for insert
  to authenticated
  with check (uploaded_by_user_id = (select auth.uid()));

drop policy "uploaders manage their own media" on public.media;
create policy "uploaders manage their own media"
  on public.media for update
  to authenticated
  using (uploaded_by_user_id = (select auth.uid()))
  with check (uploaded_by_user_id = (select auth.uid()));

drop policy "uploaders delete their own media" on public.media;
create policy "uploaders delete their own media"
  on public.media for delete
  to authenticated
  using (uploaded_by_user_id = (select auth.uid()));

-- ─── Messaging ──────────────────────────────────────────────────────────
drop policy "participants add themselves to a conversation" on public.conversation_members;
create policy "participants add themselves to a conversation"
  on public.conversation_members for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy "participants send messages" on public.messages;
create policy "participants send messages"
  on public.messages for insert
  to authenticated
  with check (sender_user_id = (select auth.uid()) and public.is_conversation_member(conversation_id));

-- ─── Notifications ──────────────────────────────────────────────────────
drop policy "users read their own notifications" on public.notifications;
create policy "users read their own notifications"
  on public.notifications for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy "users mark their own notifications read" on public.notifications;
create policy "users mark their own notifications read"
  on public.notifications for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ─── Social scaffolding ─────────────────────────────────────────────────
drop policy "posts are visible when public or owned" on public.posts;
create policy "posts are visible when public or owned"
  on public.posts for select
  to authenticated
  using (
    author_user_id = (select auth.uid())
    or public.owns_vendor(author_vendor_id)
    or (wedding_id is not null and exists (
      select 1 from public.weddings w where w.id = wedding_id and w.is_public
    ))
    or (wedding_id is null and author_vendor_id is not null)
  );

drop policy "users publish their own posts" on public.posts;
create policy "users publish their own posts"
  on public.posts for insert
  to authenticated
  with check (author_user_id = (select auth.uid()) or public.owns_vendor(author_vendor_id));

drop policy "authors manage their own posts" on public.posts;
create policy "authors manage their own posts"
  on public.posts for update
  to authenticated
  using (author_user_id = (select auth.uid()) or public.owns_vendor(author_vendor_id))
  with check (author_user_id = (select auth.uid()) or public.owns_vendor(author_vendor_id));

drop policy "authors delete their own posts" on public.posts;
create policy "authors delete their own posts"
  on public.posts for delete
  to authenticated
  using (author_user_id = (select auth.uid()) or public.owns_vendor(author_vendor_id));

drop policy "comments follow their post's visibility" on public.comments;
create policy "comments follow their post's visibility"
  on public.comments for select
  to authenticated
  using (exists (
    select 1 from public.posts p
    where p.id = post_id and (
      p.author_user_id = (select auth.uid())
      or public.owns_vendor(p.author_vendor_id)
      or (p.wedding_id is not null and exists (
        select 1 from public.weddings w where w.id = p.wedding_id and w.is_public
      ))
      or (p.wedding_id is null and p.author_vendor_id is not null)
    )
  ));

drop policy "authenticated users comment" on public.comments;
create policy "authenticated users comment"
  on public.comments for insert
  to authenticated
  with check (author_user_id = (select auth.uid()));

drop policy "authors delete their own comments" on public.comments;
create policy "authors delete their own comments"
  on public.comments for delete
  to authenticated
  using (author_user_id = (select auth.uid()));

drop policy "likes follow their post's visibility" on public.likes;
create policy "likes follow their post's visibility"
  on public.likes for select
  to authenticated
  using (exists (
    select 1 from public.posts p
    where p.id = post_id and (
      p.author_user_id = (select auth.uid())
      or public.owns_vendor(p.author_vendor_id)
      or (p.wedding_id is not null and exists (
        select 1 from public.weddings w where w.id = p.wedding_id and w.is_public
      ))
      or (p.wedding_id is null and p.author_vendor_id is not null)
    )
  ));

drop policy "users like posts as themselves" on public.likes;
create policy "users like posts as themselves"
  on public.likes for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy "users remove their own like" on public.likes;
create policy "users remove their own like"
  on public.likes for delete
  to authenticated
  using (user_id = (select auth.uid()));
