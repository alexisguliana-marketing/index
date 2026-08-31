-- §11: inviting a collaborator needs to resolve an email to an existing
-- account without exposing everyone's email address. `profiles` has no
-- `email` column on purpose (see PROJECT_STATUS.md) — it would sit under
-- the existing "profiles are readable by any authenticated user" policy
-- and let any signed-in user harvest every registered email. Instead this
-- is a SECURITY DEFINER function: exact-match lookup only, returns just
-- id + full_name, never the email itself, and is unusable for enumeration
-- beyond confirming one exact address at a time (same trade-off most
-- "invite by email" flows make).
create or replace function public.find_invitable_user(target_email text)
returns table (id uuid, full_name text)
language sql
security definer
stable
set search_path = public
as $$
  select p.id, p.full_name
  from public.profiles p
  join auth.users u on u.id = p.id
  where lower(u.email) = lower(target_email)
  limit 1;
$$;

grant execute on function public.find_invitable_user(text) to authenticated;
