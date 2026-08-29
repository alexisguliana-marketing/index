# Edge Functions

No Edge Functions yet. This directory is reserved for server-side logic that
must run with the service role key (bypassing RLS) — e.g. recomputing
`matches` after a wedding or vendor profile changes (§16-18), or fan-out
notification creation (§24). Both are deliberately left out of client-side
RLS write policies; see `supabase/migrations/20260101000300_rls_policies.sql`.
