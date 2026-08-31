-- §23: a couple can insert their own `conversation_members` row (RLS only
-- allows `user_id = auth.uid()`), but has no way to add the vendor owner's
-- row the same way. This trigger adds the vendor side automatically when a
-- conversation is created, mirroring the `handle_new_wedding` pattern
-- (SECURITY DEFINER, bypasses RLS legitimately).
create or replace function public.handle_new_conversation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.conversation_members (conversation_id, user_id, participant_type)
  select new.id, v.owner_user_id, 'vendor'
  from public.vendors v
  where v.id = new.vendor_id
  on conflict do nothing;
  return new;
end;
$$;

create trigger on_conversation_created
  after insert on public.conversations
  for each row execute function public.handle_new_conversation();
