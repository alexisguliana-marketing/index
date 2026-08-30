# Changelog

Toutes les évolutions notables du projet Wedding Univers sont documentées
ici, dans l'ordre chronologique inverse.

## [Unreleased] — PHASE 3 : Dashboard mariage

### Added

- `/mon-mariage` devient le vrai tableau de bord (§5) : en-tête couple/date/
  lieu, carte « Complétude du profil » (% de champs du mariage renseignés),
  carte « Budget » branchée sur la vue SQL `budget_summary`, carte
  « Détails du mariage » (invités, style, ambiance, cérémonie, gamme), et
  sections « à venir » honnêtes pour les tâches et les recommandations
  (aucune donnée inventée tant que ces sous-systèmes n'existent pas).

## PHASE 2 : Création du Projet Mariage

### Added

- Migration `weddings.ambiance` (champ §4 manquant du schéma initial).
- Formulaire `/mon-mariage/creer` (prénoms, date, lieu, invités, budget,
  style, ambiance, cérémonie, niveau de gamme) et Server Action associée.
- Page `/mon-mariage` : résumé en lecture seule du mariage de l'utilisateur.
- `WEDDING_STYLES`, `CEREMONY_TYPES`, `BUDGET_TIERS` dans
  `@wedding-univers/config` (libellés français).
- Redirections : inscription → création du mariage ; `/compte` et l'en-tête
  pointent désormais vers `/mon-mariage`.

## PHASE 1 : Authentification et profils (web)

### Added

- Inscription, connexion, déconnexion, mot de passe oublié et
  réinitialisation, confirmation d'email — via Supabase Auth
  (`@supabase/ssr`) et des Server Actions Next.js.
- Route `/auth/callback` pour l'échange PKCE des liens email.
- `apps/web/src/proxy.ts` : rafraîchissement de session + protection de
  `/compte` (convention Next.js 16, remplace `middleware.ts`).
- Page `/compte` (édition du prénom, déconnexion) et en-tête de site
  reflétant l'état connecté/déconnecté.
- Protection anti-open-redirect sur `?redirect=` (testée).
- `Profile` dans `@wedding-univers/types` ; schémas d'authentification dans
  `@wedding-univers/validation`.
- Dégradation gracieuse de tout le code Supabase (web) en l'absence de
  projet configuré, pour ne jamais casser `pnpm build`/`pnpm dev`.

## Fondation (PHASE 0)

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
