-- Fixes from the Supabase security advisor, run after provisioning the
-- first real project (see PROJECT_STATUS.md — this couldn't be caught by
-- the local Postgres reproduction used until now, since that advisor is a
-- Supabase-hosted feature, not a generic Postgres lint).

-- ─── ERROR: budget_summary silently bypassed RLS ────────────────────────
-- A view without `security_invoker = true` runs as its owner (the
-- migration role), not as the querying user — so despite `weddings` and
-- `budget_items` both having RLS restricting rows to wedding members, any
-- authenticated user could `select * from budget_summary where wedding_id
-- = <any wedding>` and read a stranger's budget. `security_invoker = true`
-- (Postgres 15+) makes the view re-check RLS as the calling role, exactly
-- as if they had queried `weddings`/`budget_items` directly.
alter view public.budget_summary set (security_invoker = true);

-- ─── WARN: find_invitable_user callable by anon (unauthenticated) ──────
-- The migration granted EXECUTE to `authenticated` but Supabase's default
-- privileges also expose new functions in `public` to `anon` unless
-- explicitly revoked — an unauthenticated caller could otherwise probe
-- arbitrary emails to learn who has a Wedding Univers account.
revoke execute on function public.find_invitable_user(text) from anon;
revoke execute on function public.find_invitable_user(text) from public;

-- ─── WARN: set_updated_at has a mutable search_path ─────────────────────
-- Low practical risk (SECURITY INVOKER, no unqualified references besides
-- `new`), but every other function in this codebase pins search_path —
-- fixed for consistency and to clear the advisor.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
