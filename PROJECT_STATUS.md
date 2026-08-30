# PROJECT_STATUS.md

Dernière mise à jour : 2026-08-30 — PHASE 3 (dashboard mariage) terminée, sur
PHASE 0 (fondation), PHASE 1 (authentification) et PHASE 2 (création).

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
- **PHASE 1 — Authentification et profils (web uniquement, voir Décisions
  techniques)** :
  - Inscription (email/mot de passe + prénom), connexion, déconnexion, mot
    de passe oublié / réinitialisation, confirmation email — via
    `@supabase/ssr` et des Server Actions (`apps/web/src/app/(auth)/actions.ts`,
    `apps/web/src/app/compte/actions.ts`).
  - Route `/auth/callback` (échange PKCE du code) pour les liens email de
    confirmation et de récupération de mot de passe.
  - `apps/web/src/proxy.ts` (convention Next.js 16, remplace
    `middleware.ts`) rafraîchit la session à chaque requête et protège
    `/compte`, avec redirection vers `/connexion?redirect=...`.
  - Page `/compte` protégée : édition du prénom (`profiles.full_name`),
    déconnexion. En-tête de site (`SiteHeader`) reflétant l'état
    connecté/déconnecté sur toutes les pages.
  - Protection anti-open-redirect sur le paramètre `?redirect=`
    (`lib/safe-redirect.ts`, testée).
  - `@wedding-univers/types` (`Profile`) et `@wedding-univers/validation`
    (`signUpSchema`, `signInSchema`, `requestPasswordResetSchema`,
    `resetPasswordSchema`, `updateProfileSchema`) étendus en conséquence.
  - **Dégradation gracieuse sans projet Supabase configuré** : tant que
    `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` ne sont pas
    définies, `createClient()` (web, client et serveur) renvoie `null` au
    lieu de lever une exception ; toutes les pages/actions le gèrent
    (message d'information au lieu d'un crash). Build/dev fonctionnent donc
    dès aujourd'hui, sans configuration.

- **PHASE 2 — Création du Projet Mariage** :
  - Colonne `ambiance` ajoutée à `weddings` (migration
    `20260101000500_wedding_ambiance.sql`), qui complétait le §4 (le champ
    était listé dans le cahier des charges mais absent du schéma initial).
  - `createWeddingSchema` (déjà existant) branché à un vrai formulaire
    `/mon-mariage/creer` (prénoms, date + flexibilité, lieu + "lieu connu",
    invités, budget, style, ambiance, type de cérémonie, niveau de gamme).
  - `packages/config` : `WEDDING_STYLES`, `CEREMONY_TYPES`, `BUDGET_TIERS`
    (libellés français pour les selects du formulaire, réutilisables plus
    tard par la recherche/filtres).
  - Page `/mon-mariage` : résumé en lecture seule du mariage de
    l'utilisateur (via `wedding_members` → `weddings`), redirige vers
    `/mon-mariage/creer` si aucun mariage n'existe encore.
  - `/mon-mariage/creer` redirige vers `/mon-mariage` si l'utilisateur a
    déjà un mariage (pas de doublon possible).
  - Inscription (session immédiate) redirige désormais vers
    `/mon-mariage/creer` plutôt que `/compte` — la création du mariage est
    la toute première action attendue (Principe 1). Le lien de confirmation
    email suit le même chemin via `?next=/mon-mariage/creer`.
  - `/compte` et l'en-tête de site affichent un lien vers le mariage
    (création ou consultation selon le cas).
  - La création s'appuie sur les policies RLS déjà en place (PHASE 0) :
    `insert` autorisé si `created_by = auth.uid()`, le trigger
    `handle_new_wedding` crée automatiquement la ligne `wedding_members`
    (rôle `admin`).

- **PHASE 3 — Dashboard mariage (§5)** :
  - `/mon-mariage` est devenu le vrai tableau de bord : en-tête (couple,
    date, lieu), carte "Complétude du profil" (% de champs renseignés —
    calculé, pas les tâches, voir Décisions techniques), carte "Budget"
    branchée sur la vue SQL `budget_summary` (donnée réelle, à 0 € dépensé
    tant qu'aucun poste budgétaire n'existe), carte "Détails du mariage"
    (invités, style, ambiance, cérémonie, gamme), et deux sections
    honnêtes "à venir" pour les tâches et les recommandations (pas encore
    de fausses données — ces sous-systèmes n'existent pas avant PHASE 4 et
    PHASE 11), plus une activité réelle ("Mariage créé le ...").

## En cours

Rien — la PHASE 3 est terminée. Prochaine étape : PHASE 4 (tâches et
planning).

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
- **Authentification non testée de bout en bout contre un vrai Supabase**
  (même limitation que la fondation : pas de projet distant, pas de Docker
  local). Vérifié à la place : schéma + RLS valides (PHASE 0), et
  build/lint/typecheck/tests + rendu réel de toutes les routes auth via
  `next dev` + `curl` sans exception serveur, avec Supabase non configuré
  (dégradation gracieuse). **À revalider contre un vrai projet Supabase dès
  que possible** (inscription réelle, email de confirmation, réinitialisation
  de mot de passe).
- **Types Supabase non générés** : les appels `supabase.from("profiles")...`
  sont faiblement typés (pas de `Database` généré, puisqu'aucun projet
  distant n'existe). Lancer `supabase gen types typescript` une fois un
  projet connecté, et le brancher dans `createClient<Database>(...)`.
- **apps/mobile n'a pas encore d'authentification** — décision assumée, voir
  Décisions techniques.
- **Déploiement Vercel (preview manuel, hors git)** : un premier essai a
  échoué (`npm install` a été utilisé par défaut, incompatible avec le
  protocole `workspace:*` de pnpm). Corrigé en forçant `installCommand` à
  utiliser pnpm explicitement. Ce déploiement manuel (upload de fichiers,
  pas de lockfile inclus pour éviter un lockfile désynchronisé avec le
  sous-ensemble de fichiers envoyé) est un outil de prévisualisation
  ponctuel, pas un pipeline CI/CD — un vrai déploiement continu nécessitera
  de lier le projet Vercel au dépôt GitHub une fois la branche mergée.

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
- **"Complétude du profil" (dashboard, §5)** : la maquette du cahier des
  charges montre une "Progression" à 42 %, implicitement basée sur les
  tâches accomplies — mais les tâches n'existent pas encore (PHASE 4).
  Plutôt que d'inventer un chiffre, la carte affiche pour l'instant le %
  de champs du mariage renseignés (date, lieu, invités, budget, style,
  ambiance, cérémonie, gamme), clairement intitulée "Complétude du
  profil" pour ne pas se faire passer pour la progression des tâches.
  À remplacer/compléter par un vrai indicateur de progression une fois
  les tâches disponibles.
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
- **PHASE 1 implémentée web uniquement.** Le découpage MVP du cahier des
  charges liste les phases métier (1 à 14) séparément de « PHASE 15
  Application mobile » : lu comme un séquencement délibéré (construire
  chaque fonctionnalité sur le web d'abord, porter sur mobile en fin de
  parcours), plutôt que de dupliquer chaque écran sur les deux plateformes
  à chaque phase. `apps/mobile` recevra l'authentification (et le reste)
  en PHASE 15, en réutilisant `@wedding-univers/validation` (schémas déjà
  partagés) et le même schéma Supabase/RLS.
- **`middleware.ts` → `proxy.ts`** : Next.js 16 a renommé et déprécié la
  convention `middleware` au profit de `proxy` (même mécanisme, nouveau nom
  de fichier et de fonction exportée). `apps/web/src/proxy.ts` utilise déjà
  la nouvelle convention.
- **Pas de champ "type de compte" (couple / professionnel)** : plutôt
  qu'un champ rigide sur `profiles`, le "type" d'un utilisateur se déduit
  de ce qu'il crée (une ligne `wedding_members` et/ou `vendors` — rien
  n'empêche d'être les deux). Évite un champ redondant/ambigu ; le routage
  vers "créer mon mariage" vs "créer mon profil pro" se fera en PHASE 2/8.
- **Pas d'upload d'avatar en PHASE 1** : le bucket `avatars` et ses
  policies RLS existent déjà (PHASE 0), mais l'UI d'upload n'a pas été
  construite — seule l'édition du prénom l'a été. Non demandé explicitement
  par le cahier des charges pour cette phase ; à ajouter si besoin.

## Prochaine étape

**PHASE 2 — Création du Projet Mariage** : formulaire de création
("Mon mariage" : prénoms, date, lieu, invités, budget, style, cérémonie),
enregistrement en base (`weddings` + `wedding_members` via le trigger déjà
en place), redirection post-inscription vers ce flow.
