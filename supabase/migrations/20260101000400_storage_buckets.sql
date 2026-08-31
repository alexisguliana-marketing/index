-- Wedding Univers — Storage buckets & policies (§27, §30: separate public and
-- private files; a private wedding's files must never leak).
--
-- Upload path conventions (enforced by these policies, not just app code):
--   avatars/{user_id}/...
--   vendor-portfolio/{vendor_id}/...
--   wedding-private/{wedding_id}/...

insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('vendor-portfolio', 'vendor-portfolio', true),
  ('wedding-private', 'wedding-private', false)
on conflict (id) do nothing;

-- ─── Avatars: public read, owner-only write to their own folder ────────
create policy "avatar images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "users upload to their own avatar folder"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users manage their own avatar folder"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users delete their own avatar folder"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ─── Vendor portfolio: public read, owner-only write to their vendor folder ─
create policy "vendor portfolio files are publicly readable"
  on storage.objects for select
  using (bucket_id = 'vendor-portfolio');

create policy "vendor owners upload to their own vendor folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'vendor-portfolio'
    and public.owns_vendor(((storage.foldername(name))[1])::uuid)
  );

create policy "vendor owners manage their own vendor folder"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'vendor-portfolio'
    and public.owns_vendor(((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'vendor-portfolio'
    and public.owns_vendor(((storage.foldername(name))[1])::uuid)
  );

create policy "vendor owners delete their own vendor folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'vendor-portfolio'
    and public.owns_vendor(((storage.foldername(name))[1])::uuid)
  );

-- ─── Wedding-private files: members-only, never public ─────────────────
create policy "wedding members read their private files"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'wedding-private'
    and public.is_wedding_member(((storage.foldername(name))[1])::uuid)
  );

create policy "wedding members upload to their wedding folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'wedding-private'
    and public.is_wedding_member(((storage.foldername(name))[1])::uuid)
  );

create policy "wedding members manage their wedding folder"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'wedding-private'
    and public.is_wedding_member(((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'wedding-private'
    and public.is_wedding_member(((storage.foldername(name))[1])::uuid)
  );

create policy "wedding members delete from their wedding folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'wedding-private'
    and public.is_wedding_member(((storage.foldername(name))[1])::uuid)
  );
