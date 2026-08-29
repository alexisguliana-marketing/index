# Changelog

Toutes les évolutions notables du projet Wedding Univers sont documentées
ici, dans l'ordre chronologique inverse.

## [Unreleased] — Fondation (PHASE 0)

### Added

- Archivage de l'ancienne landing page marketing personnelle vers
  `legacy/marketing-landing/`.
- Structure monorepo pnpm workspaces (`apps/*`, `packages/*`, `supabase/*`).
- `apps/web` : Next.js 16 + TypeScript + Tailwind v4, page d'accueil de
  marque, helpers Supabase (`lib/supabase/client.ts`, `server.ts`).
- `apps/mobile` : Expo SDK 57 + TypeScript, écran d'accueil de marque.
- `packages/types`, `packages/validation`, `packages/config`,
  `packages/matching`, `packages/ui` — logique et types partagés entre web
  et mobile.
- Moteur Wedding Match algorithmique et explicable
  (`packages/matching`), avec tests.
- Schéma Supabase complet (§29 du cahier des charges) : 5 migrations SQL
  couvrant mariages, tâches, budget, invités, prestataires, matching,
  favoris/collections, messagerie, notifications, structure sociale.
- Row Level Security activée sur toutes les tables + policies détaillées
  + buckets de stockage public/privé séparés (§27, §30).
- Documentation : `PROJECT_SPEC.md`, `PROJECT_STATUS.md`, ce fichier,
  `README.md`, `supabase/README.md`.
