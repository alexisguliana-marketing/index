# Changelog

Toutes les évolutions notables du projet Wedding Univers sont documentées
ici, dans l'ordre chronologique inverse.

## [Unreleased] — PHASE 10 : Portfolio

### Added

- `/pro/portfolio` (§13) : upload de photos vers Supabase Storage
  (bucket `vendor-portfolio`), tag optionnel par style/contexte/
  prestation liée, suppression (fichier + entrée base).
- `/prestataires/[id]` : carte "Portfolio" (grille d'images) quand le
  prestataire en a.
- Lien "Gérer mon portfolio" depuis `/pro/profil`.

## PHASE 9 : Recherche/filtres

### Added

- `/prestataires` (§14) : recherche publique de prestataires publiés,
  filtrable par métier, ville, prix max, note minimale et disponibilité.
- `/prestataires/[id]` : première page publique de profil détaillé
  (description, prestations/tarifs, zone d'intervention, prochaines
  indisponibilités) — première route dynamique du projet.
- Lien "Prestataires" dans l'en-tête de site, accessible sans connexion.

## PHASE 8 : Profils professionnels

### Added

- `/pro/profil/creer` (§11) : création du profil professionnel (nom,
  accroche, description, ville, zone de déplacement, expérience,
  capacité, métiers).
- `/pro/profil` : tableau de bord pro — publication/dépublication,
  gestion des métiers, prestations/tarifs, zones d'intervention et
  disponibilités.
- `/compte` propose désormais "Créer mon profil pro" en plus de "Créer
  mon mariage" (aucun champ "type de compte" — le type se déduit de ce
  que l'utilisateur crée, décision PHASE 1).
- `Vendor.isPublished` ajouté à `@wedding-univers/types`.

## PHASE 7 : Collaborateurs

### Added

- `/mon-mariage/equipe` (§10-11) : liste des membres avec leur rôle,
  invitation par email (comptes déjà inscrits), changement de rôle,
  retrait d'un membre par un admin ou par lui-même.
- Migration `20260101000600_invite_lookup.sql` : fonction
  `find_invitable_user` (résolution email → compte, sans exposer
  d'email), testée sur Postgres local.
- Garde-fou : impossible de changer le rôle du dernier administrateur ou
  de le retirer.
- `WEDDING_ROLES` (`@wedding-univers/config`) et
  `inviteWeddingMemberSchema` (`@wedding-univers/validation`).
- Dashboard (`/mon-mariage`) et en-tête de site : lien vers
  `/mon-mariage/equipe`.

## PHASE 6 : Invités

### Added

- `/mon-mariage/invites` (§9) : liste des invités (groupe, statut RSVP,
  accompagnant, enfants, hébergement, repas, coordonnées) avec résumé
  (répartition RSVP, total de personnes attendues).
- Création d'invité et changement rapide de statut RSVP (Server Actions),
  réservés aux rôles autorisés (`guests.manage`), RLS en filet de
  sécurité ; lecture ouverte à tout membre du mariage.
- Dashboard (`/mon-mariage`) et en-tête de site : lien vers
  `/mon-mariage/invites`.

## PHASE 5 : Budget

### Added

- `/mon-mariage/budget` (§8) : résumé global (vue `budget_summary` —
  total, dépensé, restant, engagé, % utilisé) et liste des postes
  budgétaires par catégorie, avec alerte visuelle en cas de dépassement.
- Création, édition (prévu/dépensé) et suppression de postes budgétaires
  (Server Actions), réservées aux rôles autorisés (`budget.manage`), RLS
  en filet de sécurité.
- Dashboard (`/mon-mariage`) et en-tête de site : lien vers
  `/mon-mariage/budget`.

## PHASE 4 : Tâches et planning

### Added

- `/mon-mariage/taches` (§6-7) : liste des tâches groupée par statut (à
  faire / en cours / terminé), avec catégorie, priorité et échéance.
- Création, changement de statut et suppression de tâches (Server
  Actions), contrôles réservés aux rôles autorisés (`tasks.manage`), RLS
  en filet de sécurité.
- Génération de la checklist par défaut à partir de la date du mariage
  (`generateDefaultChecklist`, moteur à règles configurables — pas d'IA),
  idempotente (pas de doublons).
- Dashboard (`/mon-mariage`) : carte « Prochaines tâches » branchée sur
  les vraies données ; lien « Tâches » dans l'en-tête de site.
- Tests pour `generateDefaultChecklist`
  (`packages/config/src/__tests__/checklist.test.ts`).

## PHASE 3 : Dashboard mariage

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
