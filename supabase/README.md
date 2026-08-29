# Supabase — Wedding Univers

Local Supabase project for development. No remote project has been
provisioned yet (that requires choosing an org/billing plan — a product
decision left to whoever runs this next; see PROJECT_STATUS.md).

## Structure

- `migrations/` — schema, RLS policies and storage buckets, applied in
  filename order. Validated locally against a plain Postgres 16 instance
  (Docker/Supabase CLI wasn't available in the sandbox that authored them —
  see the note in PROJECT_STATUS.md).
- `seed/seed.sql` — reference data (task & vendor categories). Keep in sync
  with `packages/config/src/taxonomies.ts` by hand.
- `functions/` — Edge Functions (none yet).

## Local development (once Docker is available)

```sh
npx supabase start   # boots local Postgres, Auth, Storage, Realtime
npx supabase db reset  # (re)applies migrations + seed
```

Then copy the printed `anon key` / API URL into `apps/web/.env.local`
(see `apps/web/.env.example`).

## Security

Every table has Row Level Security enabled — see
`migrations/20260101000300_rls_policies.sql` for the full policy set and
`migrations/20260101000400_storage_buckets.sql` for file access rules.
Nothing in this project should ever rely on frontend checks alone.
