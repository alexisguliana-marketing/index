-- §24: notifications have no INSERT policy for authenticated users by
-- design ("notifications are created by trusted server-side code") and no
-- service role key is configured in the app (see PROJECT_STATUS.md). These
-- SECURITY DEFINER triggers are that trusted server-side code — same
-- pattern as `handle_new_wedding` / `handle_new_conversation` — so real
-- notifications exist without ever needing a service role key client-side.

-- ─── New message → notify the other participant(s) ─────────────────────
create or replace function public.handle_new_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, type, payload)
  select cm.user_id, 'new_message', jsonb_build_object(
    'conversationId', new.conversation_id,
    'messagePreview', left(new.body, 140)
  )
  from public.conversation_members cm
  where cm.conversation_id = new.conversation_id
    and cm.user_id <> new.sender_user_id;
  return new;
end;
$$;

create trigger on_message_created
  after insert on public.messages
  for each row execute function public.handle_new_message();

-- ─── New wedding member → notify the wedding's existing members ────────
-- Fires on every insert, including the creator's own admin row (via
-- `handle_new_wedding`) — harmless: at that point no other member exists
-- yet, so the notification loop below simply matches zero rows.
create or replace function public.handle_new_wedding_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, type, payload)
  select wm.user_id, 'member_joined', jsonb_build_object(
    'weddingId', new.wedding_id,
    'role', new.role
  )
  from public.wedding_members wm
  where wm.wedding_id = new.wedding_id
    and wm.user_id <> new.user_id;
  return new;
end;
$$;

create trigger on_wedding_member_added
  after insert on public.wedding_members
  for each row execute function public.handle_new_wedding_member();
