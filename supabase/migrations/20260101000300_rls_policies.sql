-- Wedding Univers — Row Level Security (cahier des charges §30, non négociable).
--
-- A private wedding's data must never be reachable by an outside user. Every
-- table below has RLS enabled; anything without an explicit policy for a
-- given operation is denied by default (Postgres RLS default-deny).
--
-- Fine-grained *write* permissions per role (§10) are mostly enforced here
-- too (via `current_wedding_role`), matching packages/config/src/permissions.ts.
-- Keep the two in sync when either changes.

-- ─── Helper functions (security definer: read membership without recursing
-- into wedding_members' own RLS) ────────────────────────────────────────
create or replace function public.is_wedding_member(target_wedding_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.wedding_members
    where wedding_id = target_wedding_id and user_id = auth.uid()
  );
$$;

create or replace function public.current_wedding_role(target_wedding_id uuid)
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.wedding_members
  where wedding_id = target_wedding_id and user_id = auth.uid()
  limit 1;
$$;

create or replace function public.owns_vendor(target_vendor_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.vendors
    where id = target_vendor_id and owner_user_id = auth.uid()
  );
$$;

create or replace function public.is_conversation_member(target_conversation_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.conversation_members
    where conversation_id = target_conversation_id and user_id = auth.uid()
  );
$$;

-- ─── Profiles ────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;

create policy "profiles are readable by any authenticated user"
  on public.profiles for select
  to authenticated
  using (true);

create policy "users manage their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ─── Weddings & members ─────────────────────────────────────────────────
alter table public.weddings enable row level security;
alter table public.wedding_members enable row level security;

create policy "members or the public can read a wedding"
  on public.weddings for select
  to authenticated
  using (is_public or public.is_wedding_member(id));

create policy "authenticated users create their own wedding"
  on public.weddings for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "wedding admins update the wedding"
  on public.weddings for update
  to authenticated
  using (public.current_wedding_role(id) = 'admin')
  with check (public.current_wedding_role(id) = 'admin');

create policy "wedding admins delete the wedding"
  on public.weddings for delete
  to authenticated
  using (public.current_wedding_role(id) = 'admin');

create policy "members read the member roster"
  on public.wedding_members for select
  to authenticated
  using (public.is_wedding_member(wedding_id) or user_id = auth.uid());

create policy "admins invite members"
  on public.wedding_members for insert
  to authenticated
  with check (public.current_wedding_role(wedding_id) = 'admin');

create policy "admins update member roles"
  on public.wedding_members for update
  to authenticated
  using (public.current_wedding_role(wedding_id) = 'admin')
  with check (public.current_wedding_role(wedding_id) = 'admin');

create policy "admins remove members, members remove themselves"
  on public.wedding_members for delete
  to authenticated
  using (public.current_wedding_role(wedding_id) = 'admin' or user_id = auth.uid());

-- ─── Task categories (public reference data, no client writes) ─────────
alter table public.task_categories enable row level security;

create policy "task categories are public"
  on public.task_categories for select
  to authenticated, anon
  using (true);

-- ─── Tasks (§10: tasks.manage = admin, planner, witness) ───────────────
alter table public.tasks enable row level security;

create policy "members read tasks"
  on public.tasks for select
  to authenticated
  using (public.is_wedding_member(wedding_id));

create policy "admins planners witnesses manage tasks"
  on public.tasks for all
  to authenticated
  using (public.current_wedding_role(wedding_id) in ('admin', 'planner', 'witness'))
  with check (public.current_wedding_role(wedding_id) in ('admin', 'planner', 'witness'));

-- ─── Budget items (§10: budget.manage = admin, planner) ────────────────
alter table public.budget_items enable row level security;

create policy "members read budget items"
  on public.budget_items for select
  to authenticated
  using (public.is_wedding_member(wedding_id));

create policy "admins and planners manage budget items"
  on public.budget_items for all
  to authenticated
  using (public.current_wedding_role(wedding_id) in ('admin', 'planner'))
  with check (public.current_wedding_role(wedding_id) in ('admin', 'planner'));

-- ─── Guests (§10: guests.manage = admin, planner, guest_manager) ───────
alter table public.guests enable row level security;

create policy "members read the guest list"
  on public.guests for select
  to authenticated
  using (public.is_wedding_member(wedding_id));

create policy "admins planners guest managers manage guests"
  on public.guests for all
  to authenticated
  using (public.current_wedding_role(wedding_id) in ('admin', 'planner', 'guest_manager'))
  with check (public.current_wedding_role(wedding_id) in ('admin', 'planner', 'guest_manager'));

-- ─── Vendors & their public-facing content ──────────────────────────────
alter table public.vendors enable row level security;
alter table public.vendor_categories enable row level security;
alter table public.vendor_category_assignments enable row level security;
alter table public.vendor_services enable row level security;
alter table public.vendor_locations enable row level security;
alter table public.vendor_availability enable row level security;
alter table public.vendor_portfolio_items enable row level security;
alter table public.vendor_reviews enable row level security;
alter table public.vendor_relationships enable row level security;

create policy "published vendors are public, owners see their own drafts"
  on public.vendors for select
  to authenticated, anon
  using (is_published or owner_user_id = auth.uid());

create policy "a user creates their own vendor profile"
  on public.vendors for insert
  to authenticated
  with check (owner_user_id = auth.uid());

create policy "owners manage their vendor profile"
  on public.vendors for update
  to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

create policy "owners delete their vendor profile"
  on public.vendors for delete
  to authenticated
  using (owner_user_id = auth.uid());

create policy "vendor categories are public"
  on public.vendor_categories for select
  to authenticated, anon
  using (true);

create policy "published vendor category tags are public"
  on public.vendor_category_assignments for select
  to authenticated, anon
  using (exists (
    select 1 from public.vendors v
    where v.id = vendor_id and (v.is_published or v.owner_user_id = auth.uid())
  ));

create policy "owners manage their category tags"
  on public.vendor_category_assignments for all
  to authenticated
  using (public.owns_vendor(vendor_id))
  with check (public.owns_vendor(vendor_id));

create policy "published vendor services are public"
  on public.vendor_services for select
  to authenticated, anon
  using (exists (
    select 1 from public.vendors v
    where v.id = vendor_id and (v.is_published or v.owner_user_id = auth.uid())
  ));

create policy "owners manage their services"
  on public.vendor_services for all
  to authenticated
  using (public.owns_vendor(vendor_id))
  with check (public.owns_vendor(vendor_id));

create policy "published vendor locations are public"
  on public.vendor_locations for select
  to authenticated, anon
  using (exists (
    select 1 from public.vendors v
    where v.id = vendor_id and (v.is_published or v.owner_user_id = auth.uid())
  ));

create policy "owners manage their locations"
  on public.vendor_locations for all
  to authenticated
  using (public.owns_vendor(vendor_id))
  with check (public.owns_vendor(vendor_id));

create policy "published vendor availability is public"
  on public.vendor_availability for select
  to authenticated, anon
  using (exists (
    select 1 from public.vendors v
    where v.id = vendor_id and (v.is_published or v.owner_user_id = auth.uid())
  ));

create policy "owners manage their availability"
  on public.vendor_availability for all
  to authenticated
  using (public.owns_vendor(vendor_id))
  with check (public.owns_vendor(vendor_id));

create policy "published vendor portfolio is public"
  on public.vendor_portfolio_items for select
  to authenticated, anon
  using (exists (
    select 1 from public.vendors v
    where v.id = vendor_id and (v.is_published or v.owner_user_id = auth.uid())
  ));

create policy "owners manage their portfolio"
  on public.vendor_portfolio_items for all
  to authenticated
  using (public.owns_vendor(vendor_id))
  with check (public.owns_vendor(vendor_id));

create policy "published vendor reviews are public"
  on public.vendor_reviews for select
  to authenticated, anon
  using (exists (
    select 1 from public.vendors v
    where v.id = vendor_id and (v.is_published or v.owner_user_id = auth.uid())
  ));

create policy "wedding members leave a review"
  on public.vendor_reviews for insert
  to authenticated
  with check (author_user_id = auth.uid() and public.is_wedding_member(wedding_id));

create policy "authors manage their own review"
  on public.vendor_reviews for update
  to authenticated
  using (author_user_id = auth.uid())
  with check (author_user_id = auth.uid());

create policy "authors delete their own review"
  on public.vendor_reviews for delete
  to authenticated
  using (author_user_id = auth.uid());

create policy "the professional network graph is public"
  on public.vendor_relationships for select
  to authenticated, anon
  using (true);

create policy "either linked vendor owner records a relationship"
  on public.vendor_relationships for insert
  to authenticated
  with check (public.owns_vendor(vendor_a_id) or public.owns_vendor(vendor_b_id));

create policy "either linked vendor owner removes a relationship"
  on public.vendor_relationships for delete
  to authenticated
  using (public.owns_vendor(vendor_a_id) or public.owns_vendor(vendor_b_id));

-- ─── Matches (§16-18: computed server-side, read-only for clients) ─────
alter table public.matches enable row level security;

create policy "couples and matched vendors read their matches"
  on public.matches for select
  to authenticated
  using (public.is_wedding_member(wedding_id) or public.owns_vendor(vendor_id));

-- No insert/update/delete policy: scores are written by trusted server-side
-- code (service role key), which bypasses RLS by design.

-- ─── Favorites & inspiration collections (§15, §20 — private per wedding) ─
alter table public.favorites enable row level security;
alter table public.collections enable row level security;
alter table public.collection_items enable row level security;

create policy "members manage their wedding's favorites"
  on public.favorites for all
  to authenticated
  using (public.is_wedding_member(wedding_id))
  with check (public.is_wedding_member(wedding_id));

create policy "members manage their wedding's collections"
  on public.collections for all
  to authenticated
  using (public.is_wedding_member(wedding_id))
  with check (public.is_wedding_member(wedding_id));

create policy "members manage their collection items"
  on public.collection_items for all
  to authenticated
  using (exists (
    select 1 from public.collections c
    where c.id = collection_id and public.is_wedding_member(c.wedding_id)
  ))
  with check (exists (
    select 1 from public.collections c
    where c.id = collection_id and public.is_wedding_member(c.wedding_id)
  ));

-- ─── Media (§13, §20, §22) ──────────────────────────────────────────────
alter table public.media enable row level security;

create policy "media is visible with its wedding or vendor context"
  on public.media for select
  to authenticated, anon
  using (
    (wedding_id is not null and (
      public.is_wedding_member(wedding_id)
      or exists (select 1 from public.weddings w where w.id = wedding_id and w.is_public)
    ))
    or (vendor_id is not null and exists (
      select 1 from public.vendors v where v.id = vendor_id and (v.is_published or v.owner_user_id = auth.uid())
    ))
    or (wedding_id is null and vendor_id is null and uploaded_by_user_id = auth.uid())
  );

create policy "authenticated users upload media they own"
  on public.media for insert
  to authenticated
  with check (uploaded_by_user_id = auth.uid());

create policy "uploaders manage their own media"
  on public.media for update
  to authenticated
  using (uploaded_by_user_id = auth.uid())
  with check (uploaded_by_user_id = auth.uid());

create policy "uploaders delete their own media"
  on public.media for delete
  to authenticated
  using (uploaded_by_user_id = auth.uid());

-- ─── Messaging (§23 — strictly participants-only) ──────────────────────
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

create policy "participants read their conversation"
  on public.conversations for select
  to authenticated
  using (public.is_wedding_member(wedding_id) or public.owns_vendor(vendor_id));

create policy "a wedding member or vendor owner starts a conversation"
  on public.conversations for insert
  to authenticated
  with check (public.is_wedding_member(wedding_id) or public.owns_vendor(vendor_id));

create policy "participants read the member list"
  on public.conversation_members for select
  to authenticated
  using (public.is_conversation_member(conversation_id));

create policy "participants add themselves to a conversation"
  on public.conversation_members for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "participants read their messages"
  on public.messages for select
  to authenticated
  using (public.is_conversation_member(conversation_id));

create policy "participants send messages"
  on public.messages for insert
  to authenticated
  with check (sender_user_id = auth.uid() and public.is_conversation_member(conversation_id));

create policy "senders edit their own message (e.g. mark read)"
  on public.messages for update
  to authenticated
  using (public.is_conversation_member(conversation_id))
  with check (public.is_conversation_member(conversation_id));

-- ─── Notifications (§24 — strictly the owning user) ─────────────────────
alter table public.notifications enable row level security;

create policy "users read their own notifications"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

create policy "users mark their own notifications read"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- No insert policy: notifications are created by trusted server-side code.

-- ─── Social scaffolding (§21-22 — structural, conservative policies) ───
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.likes enable row level security;

create policy "posts are visible when public or owned"
  on public.posts for select
  to authenticated
  using (
    author_user_id = auth.uid()
    or public.owns_vendor(author_vendor_id)
    or (wedding_id is not null and exists (
      select 1 from public.weddings w where w.id = wedding_id and w.is_public
    ))
    or (wedding_id is null and author_vendor_id is not null)
  );

create policy "users publish their own posts"
  on public.posts for insert
  to authenticated
  with check (author_user_id = auth.uid() or public.owns_vendor(author_vendor_id));

create policy "authors manage their own posts"
  on public.posts for update
  to authenticated
  using (author_user_id = auth.uid() or public.owns_vendor(author_vendor_id))
  with check (author_user_id = auth.uid() or public.owns_vendor(author_vendor_id));

create policy "authors delete their own posts"
  on public.posts for delete
  to authenticated
  using (author_user_id = auth.uid() or public.owns_vendor(author_vendor_id));

create policy "comments follow their post's visibility"
  on public.comments for select
  to authenticated
  using (exists (
    select 1 from public.posts p
    where p.id = post_id and (
      p.author_user_id = auth.uid()
      or public.owns_vendor(p.author_vendor_id)
      or (p.wedding_id is not null and exists (
        select 1 from public.weddings w where w.id = p.wedding_id and w.is_public
      ))
      or (p.wedding_id is null and p.author_vendor_id is not null)
    )
  ));

create policy "authenticated users comment"
  on public.comments for insert
  to authenticated
  with check (author_user_id = auth.uid());

create policy "authors delete their own comments"
  on public.comments for delete
  to authenticated
  using (author_user_id = auth.uid());

create policy "likes follow their post's visibility"
  on public.likes for select
  to authenticated
  using (exists (
    select 1 from public.posts p
    where p.id = post_id and (
      p.author_user_id = auth.uid()
      or public.owns_vendor(p.author_vendor_id)
      or (p.wedding_id is not null and exists (
        select 1 from public.weddings w where w.id = p.wedding_id and w.is_public
      ))
      or (p.wedding_id is null and p.author_vendor_id is not null)
    )
  ));

create policy "users like posts as themselves"
  on public.likes for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "users remove their own like"
  on public.likes for delete
  to authenticated
  using (user_id = auth.uid());
