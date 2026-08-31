# PROJECT_STATUS.md

Dernière mise à jour : 2026-08-31 — PHASE 11 (Wedding Match) terminée,
sur PHASE 0 (fondation), PHASE 1 (authentification), PHASE 2 (création),
PHASE 3 (dashboard), PHASE 4 (tâches et planning), PHASE 5 (budget),
PHASE 6 (invités), PHASE 7 (collaborateurs), PHASE 8 (profils
professionnels), PHASE 9 (recherche/filtres) et PHASE 10 (portfolio).

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

- **PHASE 4 — Tâches et planning (§6-7)** :
  - `/mon-mariage/taches` : liste des tâches groupée par statut (à faire /
    en cours / terminé), avec catégorie, priorité et échéance affichées.
  - Création de tâche (formulaire + `createTaskAction`), changement de
    statut et suppression (`updateTaskStatusAction`, `deleteTaskAction`) —
    contrôles visibles seulement pour les rôles ayant `tasks.manage`
    (`hasPermission`, déjà défini en PHASE 0), RLS en filet de sécurité
    côté base dans tous les cas.
  - Bouton « Générer la checklist par défaut » : appelle
    `generateDefaultChecklist` (`packages/config`, moteur à règles, pas
    d'IA) à partir de la date du mariage, résout les catégories vers
    `task_categories` en base, et ignore les titres déjà présents pour
    rester idempotent (pas de doublons si on clique plusieurs fois).
  - Le dashboard (`/mon-mariage`) affiche désormais les vraies prochaines
    tâches (au lieu du message "à venir" de la PHASE 3) et lien vers
    `/mon-mariage/taches` ; lien "Tâches" ajouté à l'en-tête de site.
  - Tests ajoutés pour `generateDefaultChecklist`
    (`packages/config/src/__tests__/checklist.test.ts`).

- **PHASE 5 — Budget (§8)** :
  - `/mon-mariage/budget` : résumé global (branché sur la vue
    `budget_summary` déjà utilisée en lecture seule dans le dashboard
    PHASE 3 — total, dépensé, restant, engagé, % utilisé) puis liste des
    postes budgétaires (`budget_items` : catégorie, libellé, prévu,
    dépensé, restant par poste, alerte visuelle en cas de dépassement).
  - Création, édition (prévu/dépensé) et suppression de postes — réservées
    aux rôles avec `budget.manage` (admin, planner) ; les autres rôles
    (tous ont `budget.view`) voient la page en lecture seule. RLS en filet
    de sécurité côté base dans tous les cas.
  - Le dashboard (`/mon-mariage`) et l'en-tête de site pointent désormais
    vers `/mon-mariage/budget` (« Voir le détail des postes → », lien
    « Budget »).
  - Les postes réutilisent les mêmes catégories que les tâches
    (`task_categories`, `TASK_CATEGORIES`) — cohérent avec le schéma §29
    qui ne prévoit pas de taxonomie budget séparée.

- **PHASE 6 — Invités (§9)** :
  - `/mon-mariage/invites` : liste des invités avec groupe
    (famille/amis/collègues/témoins/autres), statut RSVP (en
    attente/confirmé/décliné), accompagnant, nombre d'enfants,
    hébergement, préférence repas, email/téléphone. Résumé en tête de
    page (total enregistré, répartition RSVP, total de personnes
    attendues en comptant accompagnants et enfants).
  - Création d'invité et changement rapide de statut RSVP (Server
    Actions), réservés aux rôles avec `guests.manage` (admin, planner,
    guest_manager) ; les autres membres voient la liste en lecture seule
    (RLS : tout membre du mariage peut lire). RLS en filet de sécurité
    dans tous les cas.
  - Dashboard (`/mon-mariage`) et en-tête de site pointent désormais vers
    `/mon-mariage/invites`.

- **PHASE 7 — Collaborateurs (§10-11)** :
  - `/mon-mariage/equipe` : liste des membres du mariage avec leur rôle,
    invitation par email (réservée aux admins), changement de rôle,
    retrait d'un membre par un admin, et un membre peut se retirer
    lui-même (« Quitter ce mariage »).
  - Nouvelle fonction SQL `public.find_invitable_user(target_email)`
    (migration `20260101000600_invite_lookup.sql`, `SECURITY DEFINER`) :
    résout un email vers un compte existant (id + prénom uniquement,
    jamais l'email) sans ajouter de colonne `email` largement lisible sur
    `profiles` — voir Décisions techniques pour le raisonnement complet.
  - Garde-fou : impossible de changer le rôle du dernier administrateur
    ou de le retirer (éviterait un mariage sans administrateur). Contrôlé
    à la fois dans l'UI (bouton désactivé) et dans les Server Actions.
  - S'appuie entièrement sur les policies RLS `wedding_members` déjà
    présentes depuis la PHASE 0 (lecture par les membres, invitation/
    changement de rôle par un admin, suppression par un admin ou par
    l'intéressé lui-même) — aucune nouvelle policy nécessaire.
  - `WEDDING_ROLES` (libellés français) dans `@wedding-univers/config` ;
    `inviteWeddingMemberSchema` dans `@wedding-univers/validation`.
  - Dashboard et en-tête de site pointent vers `/mon-mariage/equipe`.

- **PHASE 8 — Profils professionnels (§11)** :
  - Première fonctionnalité côté "Professionnel" (tout le développement
    précédent servait le côté "Couple"). Confirme la décision PHASE 1 :
    pas de champ "type de compte" — un utilisateur devient professionnel
    en créant un profil `vendors`, exactement comme il devient couple en
    créant un `weddings`. `/compte` propose désormais les deux chemins.
  - `/pro/profil/creer` : formulaire de création (nom, accroche,
    description, ville, zone de déplacement, expérience, capacité,
    métiers). Un seul profil par utilisateur (redirection si déjà
    existant, même schéma que `/mon-mariage/creer`).
  - `/pro/profil` : tableau de bord du professionnel — statut publié/
    brouillon avec bascule, détails du profil (lecture seule, comme pour
    le mariage — voir Décisions techniques), gestion des métiers,
    prestations/tarifs, zones d'intervention et disponibilités
    (ajout/suppression pour chacun).
  - S'appuie entièrement sur les policies RLS `vendors`/`vendor_*` déjà
    présentes depuis la PHASE 0 (`owns_vendor`, visibilité publique
    conditionnée à `is_published`) — aucune nouvelle policy nécessaire.
  - `Vendor.isPublished` ajouté à `@wedding-univers/types` (champ manquant
    du type malgré la colonne déjà en base depuis la PHASE 0).

- **PHASE 9 — Recherche/filtres (§14)** :
  - `/prestataires` : recherche publique (accessible sans connexion, RLS
    `to authenticated, anon` déjà en place PHASE 0) des prestataires
    **publiés**, filtrable par métier, ville, prix max, note minimale et
    disponibilité à une date. Formulaire GET simple (pas de JS requis),
    résultats triés par note décroissante.
  - `/prestataires/[id]` : première page publique de Wedding Univers —
    profil détaillé en lecture seule (description, zone, expérience,
    capacité, métiers, prestations/tarifs, zone d'intervention, prochaines
    indisponibilités). Première route dynamique du projet
    (`PageProps<"/prestataires/[id]">`, `params` asynchrone — convention
    Next.js 16).
  - Filtre disponibilité : exclut uniquement les prestataires
    explicitement marqués indisponibles à cette date (cohérent avec la
    sémantique "absence de ligne = inconnu" établie en PHASE 8) — ne
    retire jamais un prestataire faute de donnée.
  - Lien "Prestataires" ajouté à l'en-tête de site, visible que
    l'utilisateur soit connecté ou non (contrairement aux autres liens,
    tous réservés aux utilisateurs connectés).
  - Testé avec `next dev` réel (les 3 routes répondent 200 et affichent
    l'état "Configuration requise" attendu sans projet Supabase
    connecté), en plus de typecheck/lint/build.

- **PHASE 10 — Portfolio (§13)** :
  - `/pro/portfolio` : upload de photos (Supabase Storage, bucket
    `vendor-portfolio` déjà en place PHASE 0), tag optionnel par style
    (`WEDDING_STYLES`), contexte (`VENDOR_CONTEXT_TAGS` — mariage/
    cérémonie/réception/fiançailles) et prestation liée, suppression
    (fichier + ligne `media`, `vendor_portfolio_items` supprimée en
    cascade). Lien depuis `/pro/profil`.
  - `/prestataires/[id]` : nouvelle carte "Portfolio" (grille d'images)
    quand le prestataire en a — première fois que le site affiche des
    fichiers uploadés par un utilisateur.
  - Upload géré par une Server Action recevant directement le `File` via
    `FormData` (`encType="multipart/form-data"` sur un formulaire natif,
    aucun JavaScript client nécessaire) — cohérent avec le reste du site,
    aucune nouvelle dépendance.
  - Sécurité en profondeur déjà en place depuis la PHASE 0, aucune policy
    nouvelle : la policy de stockage exige `owns_vendor` sur le dossier
    `{vendor_id}/...`, et `vendor_portfolio_items` exige `owns_vendor` en
    RLS — un utilisateur ne peut ni uploader dans le dossier d'un autre
    prestataire, ni rattacher un média à un profil qui n'est pas le sien.
  - Testé avec `next dev` réel (upload non exercé faute de projet
    Supabase connecté — voir Problèmes connus — mais la route rend sans
    erreur), en plus de typecheck/lint/build.

- **PHASE 11 — Wedding Match, sens couple → prestataires (§16-17)** :
  - `/mon-mariage/recommandations` : recommandations par métier
    (onglets), calculées par `rankVendorsForCouple`/`topReasons`
    (`packages/matching`, moteur algorithmique déjà construit et testé
    en PHASE 0) branché sur de vraies données — mariage, prestataires
    publiés, prestations (fourchette de prix), zones (coordonnées),
    disponibilités à la date du mariage, styles déduits du portfolio
    (PHASE 10). Score toujours accompagné de ses raisons (`topReasons`,
    jamais un pourcentage nu — §17).
  - Nouveau crosswalk `VENDOR_TO_TASK_CATEGORY`
    (`packages/config/src/vendor-task-category-map.ts`, testé) : les
    métiers prestataires (§12) et les catégories de tâches/budget (§6)
    sont deux taxonomies indépendantes qui ne partagent pas de slugs ;
    ce crosswalk sert uniquement à retrouver le poste budgétaire
    pertinent (ex. "Photographie") pour le critère "Budget" du score.
  - Dashboard (`/mon-mariage`) : carte "Recommandations" branchée sur la
    vraie fonctionnalité ; lien "Recommandations" ajouté à l'en-tête.
  - **Scores non mis en cache** : la table `matches` (§29, PHASE 0) n'a
    volontairement aucune policy RLS d'écriture pour les utilisateurs
    authentifiés — le commentaire de la migration
    `20260101000300_rls_policies.sql` est explicite : "scores are written
    by trusted server-side code (service role key)". Aucune clé service
    role n'est configurée dans l'app (et personne n'a demandé qu'elle le
    soit). La PHASE 11 respecte donc cette conception : les scores sont
    calculés à la demande, à chaque affichage, jamais persistés. Voir
    Décisions techniques pour le détail et la piste d'évolution.
  - **Sens inverse ("opportunités" côté pro, §18) non construit** :
    `rankCouplesForVendor` existe déjà dans `packages/matching` (fonction
    pure, symétrique), mais l'alimenter demanderait d'exposer les champs
    de matching de mariages **auxquels le prestataire n'appartient pas**
    (date, budget, style...) — aucune source de données respectueuse de
    la vie privée n'existe encore pour ça (pas de pages de mariage
    publiques, pas de mise en relation via favoris/messagerie). Reporté
    à une itération future plutôt que bricolé. Voir Décisions techniques.

## En cours

Rien — la PHASE 11 est terminée. Prochaine étape : PHASE 12
(favoris/contact).

## Problèmes connus / limitations assumées

- **Aucun projet Supabase distant n'a été provisionné.** Cela impliquerait
  de choisir une organisation/un plan de facturation — décision produit
  laissée à l'utilisateur. `apps/web/.env.example` documente les variables
  à renseigner une fois le projet créé. Conséquence PHASE 10 : l'upload
  vers Supabase Storage (`/pro/portfolio`) n'a pas pu être exercé de bout
  en bout (nécessite un vrai bucket) — seule la page elle-même a été
  vérifiée (rendu sans erreur avec `next dev`). Le bucket
  `vendor-portfolio` et ses policies sont bien créés par la migration
  `20260101000400_storage_buckets.sql`, validée séparément (voir
  ci-dessous). **À tester en conditions réelles dès qu'un projet est
  connecté.**
- **Les migrations n'ont pas été validées via `supabase start` /
  `supabase db reset`** : le sandbox de développement n'a pas de daemon
  Docker actif (le CLI Supabase est disponible via `npx`, mais nécessite
  Docker pour la stack locale complète). Validation alternative effectuée :
  application manuelle des fichiers de migration (6 à ce jour) + seed sur
  un Postgres 16 local, avec des tables `auth.*`/`storage.*` et rôles
  `anon` / `authenticated` / `service_role` reconstitués à l'identique de
  ce que fournit Supabase. Toutes les migrations s'appliquent sans erreur
  et RLS est actif sur 100% des tables `public`. La fonction
  `find_invitable_user` (PHASE 7) a été testée avec ce même Postgres local
  (recherche insensible à la casse, aucune fuite d'email, aucun résultat
  pour un email inconnu). **À revalider avec le vrai CLI Supabase dès que
  Docker est disponible.**
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
  les tâches disponibles. **Mise à jour PHASE 4** : les tâches existent
  désormais, mais la carte dashboard n'a délibérément pas été reconvertie
  en "% de tâches terminées" — au début d'un projet, 0 tâche terminée sur
  0 tâche créée donnerait un indicateur vide ou trompeur. La progression
  réelle des tâches (fait/total) vit sur `/mon-mariage/taches`, où elle a
  du sens ; la carte dashboard reste un indicateur de complétude du
  *profil*, pas de la checklist.
- **Vue tâches : liste groupée par statut uniquement (§7 mentionne aussi
  calendrier/échéances)** : la V1 de la PHASE 4 livre la vue liste, qui
  couvre déjà l'essentiel (créer, prioriser, suivre). Vue calendrier et
  filtre par échéance reportés à une itération future si le besoin est
  confirmé, pour ne pas construire une UI supplémentaire non demandée
  explicitement à ce stade.
- **Postes budgétaires non liés à un prestataire** : `budget_items` n'a pas
  de colonne `vendor_id` en V1 — les profils prestataires n'existent pas
  avant PHASE 8. Le rapprochement poste ↔ prestataire (ex : le poste
  "Traiteur" pointant vers le prestataire réservé) est un enrichissement
  naturel à ajouter en PHASE 8/12, pas une régression de la PHASE 5.
- **"Engagé" (`budget_summary.committed`)** : défini en base (PHASE 0)
  comme la somme des montants *prévus* des postes pas encore payés
  (`spent = 0`) — affiché tel quel sur `/mon-mariage/budget`. Dès qu'un
  poste a un paiement partiel (`spent > 0`), tout son "prévu" sort de
  "engagé" ; c'est une approximation simple assumée pour la V1 plutôt
  qu'un vrai suivi engagé/payé partiel, qui demanderait une colonne dédiée.
- **Pas d'édition complète d'un invité après création** : seul le statut
  RSVP se modifie en un clic (pending/confirmed/declined) ; les autres
  champs (accompagnant, enfants, repas, hébergement, coordonnées) ne sont
  éditables qu'à la création. Même compromis que pour les tâches — un
  invité mal saisi se supprime et se recrée pour l'instant. Une vraie
  édition inline viendra si le besoin se confirme à l'usage.
- **`guests.view` n'existe pas dans la matrice de permissions** : la
  lecture de la liste d'invités n'est pas gérée par
  `packages/config/src/permissions.ts` (contrairement au budget) mais
  directement par la policy RLS "members read the guest list" — tout
  membre du mariage peut voir la liste, seul `guests.manage` (admin,
  planner, guest_manager) est dans la matrice pour les actions d'écriture.
  Cohérent avec §10 qui ne liste pas de droit de lecture distinct pour les
  invités.
- **Invitation par email limitée aux comptes déjà inscrits** : il n'existe
  pas d'infrastructure d'envoi d'email d'invitation en V1 (pas de service
  email configuré, pas de flux "créer un compte à partir d'un lien
  d'invitation"). `find_invitable_user` ne peut donc résoudre qu'un email
  déjà associé à un compte Wedding Univers ; sinon l'admin voit un message
  clair l'invitant à demander à la personne de créer un compte d'abord.
  Un vrai flux d'invitation par email (avec envoi de lien, compte créé à
  l'acceptation) est un enrichissement naturel pour une itération future,
  pas un manque de la PHASE 7.
- **Pas de colonne `email` sur `profiles`** : la policy RLS existante
  "profiles are readable by any authenticated user" (`using (true)`,
  PHASE 0) rend déjà `full_name`/`avatar_url` visibles à tout utilisateur
  connecté ; y ajouter `email` aurait permis à n'importe qui d'aspirer la
  liste complète des emails inscrits. `find_invitable_user` évite ce
  problème : fonction `SECURITY DEFINER` qui lit `auth.users.email`
  directement, recherche par correspondance exacte uniquement, et ne
  renvoie jamais l'email (juste id + prénom) — impossible à énumérer, au
  pire on confirme qu'un email précis est déjà inscrit (compromis standard
  des flux "inviter par email").
- **Invitation = ajout immédiat, pas d'étape d'acceptation** : `joined_at`
  reste nullable en base (prévu dès la PHASE 0 pour un futur flux avec
  acceptation), mais la PHASE 7 le renseigne immédiatement à l'invitation
  — comme la plupart des outils de collaboration simples (ajouter un
  collaborateur par email donne un accès immédiat). Pas d'écran
  d'acceptation ni de notification construits pour cette phase.
- **Garde-fou "dernier administrateur"** : appliqué côté UI (contrôles
  désactivés) et dans les Server Actions (`updateMemberRoleAction`,
  `removeMemberAction`), mais pas en RLS/contrainte base — un accès direct
  à la base pourrait donc encore vider les admins d'un mariage. Acceptable
  pour la V1 (aucun accès direct à la base prévu en dehors de l'admin
  Supabase du projet) ; à durcir avec un trigger si besoin plus tard.
- **Pas d'édition des champs principaux du profil pro après création**
  (nom, accroche, description, ville, zone de déplacement, expérience,
  capacité) : même compromis assumé que pour `weddings` en PHASE 2/3 —
  aucune des deux entités n'a encore d'écran d'édition des champs de
  création. Un futur "modifier mon mariage / mon profil pro" couvrirait
  les deux d'un coup plutôt que d'être construit deux fois séparément.
- **Disponibilités = uniquement des dates connues** : une ligne
  `vendor_availability` n'est créée que pour une date explicitement
  marquée disponible ou indisponible ; l'absence de ligne signifie
  "inconnu", pas "disponible par défaut" — cohérent avec
  `packages/matching` qui traite `isAvailableOnDate: null` comme un cas à
  part (score neutre 0.5, "Disponibilité inconnue à cette date."), pas
  comme une disponibilité positive.
- **Tags de contexte du portfolio pas encore utilisés** :
  `VENDOR_CONTEXT_TAGS` (mariage/cérémonie/réception/fiançailles,
  `packages/config`) et `vendor_categories.parent_id` existent en base et
  dans le seed depuis la PHASE 0, mais ne servent qu'au moment de tagger
  un élément de portfolio (§13) — hors périmètre PHASE 8, qui ne gère que
  les métiers de premier niveau (`VENDOR_PROFESSIONS`). Utilisés en
  PHASE 10.
- **Filtres distance et style reportés, filtre "gamme" absent** :
  `vendorSearchFiltersSchema` (PHASE 0) déclare aussi `maxDistanceKm` et
  `style`, non exposés dans le formulaire PHASE 9. Distance : calcul
  nécessiterait des coordonnées lat/lng pour le mariage, or `weddings`
  n'a qu'un champ `location` en texte libre (pas de géocodage prévu en
  V1). Style : c'est un attribut des éléments de portfolio
  (`vendor_portfolio_items.style`), pas du prestataire lui-même — n'a de
  sens qu'une fois le portfolio construit (PHASE 10). Gamme (niveau de
  budget) : n'existe pas comme colonne sur `vendors` dans le schéma §29 ;
  se déduirait plutôt d'une fourchette de prix sur les prestations,
  non implémenté pour rester dans le périmètre de cette phase.
  Ces trois filtres restent dans le schéma de validation, prêts à être
  branchés dès que leurs données sous-jacentes existent.
- **Portfolio : photos uniquement, pas de vidéo, pas de redimensionnement**
  : `media.kind` accepte `'video'` en base (prévu au schéma §13/§29), mais
  la PHASE 10 ne construit que l'upload photo — la lecture vidéo (player,
  éventuelle transcodage/miniature) est un morceau de travail à part,
  hors périmètre de cette phase. Les images sont stockées telles
  qu'uploadées, sans redimensionnement ni compression côté serveur :
  Supabase Storage sert le fichier original ; un pipeline d'optimisation
  d'image est un enrichissement futur, pas un manque de cette phase.
- **`vendor_portfolio_items.wedding_id` non exposé** : la colonne existe
  (le vrai mariage où la photo a été prise, "quand connu", §13) mais
  rattacher une photo à un mariage précis demanderait une recherche de
  mariage par le prestataire, qui n'existe pas encore. Laissé à `null`
  pour l'instant ; alimente potentiellement la future page "Mariages
  réels" (hors périmètre MVP, voir roadmap macro).
- **Critère "Localisation" toujours neutre en PHASE 11** : le moteur a
  besoin de coordonnées lat/lng des deux côtés ; `vendor_locations` en a
  (PHASE 0), mais `weddings.location` reste un texte libre sans
  géocodage (même limitation déjà notée en PHASE 9 pour le filtre
  distance de `/prestataires`). Le critère "Localisation" retombe donc
  systématiquement sur le score neutre 0.5 ("Localisation non
  renseignée.") plutôt que de biaiser le classement avec une fausse
  précision. Un géocodage de `weddings.location` (ou un couple de champs
  lat/lng saisis à la création) débloquerait ce critère sans toucher au
  moteur lui-même — c'est tout l'intérêt de son découpage en critères
  indépendants.
- **Critères "Type de mariage" et "Préférences" toujours neutres** :
  `vendor.ceremonyTypes` et `vendor.tags` n'ont pas de colonne source en
  base (rien dans le schéma §29 ne capture "quels types de cérémonie ce
  prestataire couvre" ni des tags libres) ; passés à `[]` systématiquement
  plutôt qu'inventés. Pareil pour `couple.preferenceTags` (aucun champ
  "préférences" sur `weddings`). Les deux critères sont donc actifs dans
  le moteur mais neutres avec les données actuelles — comportement
  documenté, pas un bug.
- **Budget par catégorie = somme des postes déjà budgétés** : quand
  plusieurs `budget_items` de la même catégorie existent pour un mariage
  (ex. "Photographe" + "Album photo" en Photographie), le critère
  "Budget" du score additionne leurs montants prévus plutôt que de n'en
  retenir qu'un seul — hypothèse simple assumée pour la V1, cohérente
  avec l'idée qu'ils représentent l'enveloppe totale de la catégorie.
- **Recommandations mono-métier** : `/mon-mariage/recommandations`
  affiche un métier à la fois (onglets), jamais un classement mélangeant
  photographes et traiteurs — le budget et la capacité n'ont pas la même
  échelle d'un métier à l'autre, un score global inter-métiers n'aurait
  pas de sens.
- **Assignation de tâche à un collaborateur** : la colonne
  `assignee_member_id` existe déjà en base (PHASE 0) mais n'est pas encore
  exposée dans le formulaire de création — la gestion des collaborateurs
  (rôles, invitations) n'arrive qu'en PHASE 7. Exposer l'assignation avant
  d'avoir une UI pour voir *qui* est membre du mariage aurait peu de sens.
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

**PHASE 12 — Favoris/contact** : `favorites` et `collections` (déjà en
base, PHASE 0) pour sauvegarder prestataires/photos/inspirations par
mariage, et un premier point de contact couple → prestataire (avant la
vraie messagerie de la PHASE 13).
