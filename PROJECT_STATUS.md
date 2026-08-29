# PROJECT_STATUS.md

Dernière mise à jour : 2026-08-29 — Fondation (PHASE 0 : architecture et
environnement), avant toute fonctionnalité métier.

## Fonctionnalités terminées

- **Monorepo** pnpm workspaces (`apps/*`, `packages/*`) avec TypeScript
  strict partagé (`tsconfig.base.json`).
- **apps/web** — Next.js 16 (App Router, TypeScript, Tailwind v4), page
  d'accueil de marque provisoire, build/lint/dev vérifiés.
- **apps/mobile** — Expo SDK 57 (React Native, TypeScript), écran d'accueil
  de marque provisoire consommant `@wedding-univers/ui`, export Metro
  (iOS) vérifié (résolution du monorepo pnpm confirmée).
- **Packages partagés** :
  - `@wedding-univers/types` — entités du domaine (Wedding, Task, Guest,
    Vendor, etc.) miroir du schéma Supabase.
  - `@wedding-univers/validation` — schémas Zod pour les entrées critiques
    (création de mariage, tâche, poste budgétaire, invité, prestataire).
  - `@wedding-univers/config` — checklist par défaut **basée sur des règles
    configurables** (§7, pas d'IA), matrice de permissions par rôle (§10),
    taxonomies (catégories de tâches, groupes d'invités, catégories
    prestataires hiérarchiques).
  - `@wedding-univers/matching` — moteur Wedding Match algorithmique,
    poids configurables, explications par critère (§16-18), matching
    symétrique couple→prestataire et prestataire→couple. Testé
    (`pnpm --filter @wedding-univers/matching test`).
  - `@wedding-univers/ui` — design tokens de marque (couleurs, typo,
    espacements) partagés web/mobile.
- **Supabase (local)** — schéma complet (§29) en 5 migrations SQL :
  profils, mariages/membres/rôles, tâches, budget (calculé via vue),
  invités, prestataires (profil, catégories hiérarchiques, services,
  zones, disponibilités, portfolio, avis), matches (cache), écosystème
  prestataires, favoris/collections, messagerie, notifications, structure
  sociale minimale. **RLS activé sur toutes les tables** + policies +
  buckets de stockage (public/privé séparés). Validé en appliquant les 5
  migrations + le seed sur un Postgres 16 local (voir « Problèmes connus »
  pour le détail de la méthode).
- **Documentation** : ce fichier, `PROJECT_SPEC.md`, `CHANGELOG.md`,
  `README.md`, `supabase/README.md`.
- **Archivage** : l'ancienne landing page marketing personnelle
  (`index.html`) déplacée vers `legacy/marketing-landing/` à la demande de
  l'utilisateur, pour laisser la racine du repo au monorepo.

## En cours

Rien — la fondation (PHASE 0) est terminée. Prochaine étape : PHASE 1.

## Problèmes connus / limitations assumées

- **Aucun projet Supabase distant n'a été provisionné.** Cela impliquerait
  de choisir une organisation/un plan de facturation — décision produit
  laissée à l'utilisateur. `apps/web/.env.example` documente les variables
  à renseigner une fois le projet créé.
- **Les migrations n'ont pas été validées via `supabase start` /
  `supabase db reset`** : le sandbox de développement n'a pas de daemon
  Docker actif (le CLI Supabase est disponible via `npx`, mais nécessite
  Docker pour la stack locale complète). Validation alternative effectuée :
  application manuelle des 5 fichiers de migration + seed sur un Postgres
  16 local, avec des tables `auth.*`/`storage.*` et rôles `anon` /
  `authenticated` / `service_role` reconstitués à l'identique de ce que
  fournit Supabase. Toutes les migrations s'appliquent sans erreur et RLS
  est actif sur 100% des tables `public`. **À revalider avec le vrai CLI
  Supabase dès que Docker est disponible.**
- **Permissions par rôle** : RLS applique déjà les permissions §10 pour
  tâches/budget/invités (voir `supabase/migrations/..._rls_policies.sql`),
  en miroir de `packages/config/src/permissions.ts`. Garder les deux
  synchronisés à la main si les rôles évoluent.
- **Avertissement pnpm** : conflit mineur de peer dependency entre
  `react-dom@19.2.8` (web) et `react@19.2.3` (Expo) — normal dans un
  monorepo Next.js + Expo, chaque app garde sa propre version de React ;
  aucune action requise.

## Décisions techniques

- **"users" (§29)** → géré par `auth.users` (Supabase Auth) + une table
  d'extension `public.profiles`. Pas de table `users` séparée (duplication
  inutile).
- **"couples" (§29)** → pas de table dédiée. Les deux partenaires sont les
  lignes `wedding_members` avec `role = 'admin'` (conforme à l'exemple
  §10 : "Alexis & Julie — Administrateurs").
- **"wedding_roles" (§29)** → rôles fixes définis dans le code
  (`packages/config/src/permissions.ts`) plutôt qu'une table éditable, car
  la V1 n'a pas d'UI de rôles personnalisés. Contrainte `CHECK` en base ;
  migration facile vers une vraie table plus tard.
- **"budgets" (§29)** → pas de table stockée : le §8 décrit explicitement
  des valeurs *calculées* (total, dépensé, restant, engagé, % utilisé).
  Implémenté comme une vue SQL (`public.budget_summary`) sur
  `weddings.budget_total` + `SUM(budget_items.spent)`.
- **Moteur Wedding Match** : fonctions pures, sans dépendance externe,
  regroupées par critère (`packages/matching/src/engine.ts`) pour rester
  auditables — aligné avec le Principe 2 (pas d'IA gadget). Les poids
  (`DEFAULT_MATCH_WEIGHTS`) sont un paramètre, jamais codés en dur dans le
  calcul.
- **Package manager** : pnpm (workspaces natifs, rapide, bien supporté par
  Expo/Metro dès SDK 49+ sans configuration `metro.config.js` custom —
  vérifié : la détection du monorepo est automatique).
- **apps/mobile** n'utilise pas encore de librairie de navigation
  (React Navigation / Expo Router) : hors périmètre de la PHASE 0, à
  ajouter en PHASE 15 (ou plus tôt si une phase business mobile le
  nécessite avant).

## Prochaine étape

**PHASE 1 — Authentification et profils** : intégrer Supabase Auth
(web via `@supabase/ssr`, déjà configuré dans `apps/web/src/lib/supabase/`
mais pas encore branché à des pages ; mobile à équiper), écrans
inscription/connexion, complétion de profil.
