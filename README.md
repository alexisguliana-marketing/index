# Wedding Univers

> La plateforme qui réunit tout l'univers du mariage.

Monorepo pnpm pour la plateforme Wedding Univers (web + mobile + backend
Supabase). Voir `PROJECT_SPEC.md` pour la spécification produit complète et
`PROJECT_STATUS.md` pour l'état d'avancement.

## Arborescence

```
wedding-univers/
├── apps/
│   ├── web/        # Next.js (App Router, TypeScript)
│   └── mobile/     # Expo (React Native, TypeScript)
├── packages/
│   ├── ui/          # Design tokens partagés
│   ├── types/        # Types du domaine (miroir du schéma Supabase)
│   ├── validation/    # Schémas Zod
│   ├── matching/      # Moteur Wedding Match (algorithmique, explicable)
│   └── config/        # Règles configurables : checklist, permissions, taxonomies
├── supabase/
│   ├── migrations/    # Schéma SQL + RLS + storage
│   ├── functions/     # Edge Functions (à venir)
│   └── seed/          # Données de référence
├── legacy/
│   └── marketing-landing/  # Ancienne landing page personnelle, archivée
├── PROJECT_SPEC.md
├── PROJECT_STATUS.md
└── CHANGELOG.md
```

## Démarrer

Prérequis : Node ≥ 20, [pnpm](https://pnpm.io) ≥ 10.

```sh
pnpm install

# Web
pnpm dev:web        # http://localhost:3000

# Mobile
pnpm dev:mobile      # ouvre l'interface Expo (Metro)
```

### Backend Supabase

Un projet Supabase distant n'a pas encore été provisionné (voir
`PROJECT_STATUS.md`). Pour développer en local avec Docker :

```sh
cd supabase
npx supabase start
npx supabase db reset   # applique migrations + seed
```

Copiez ensuite l'URL et la clé anonyme affichées dans
`apps/web/.env.local` (voir `apps/web/.env.example`).

## Scripts utiles (racine)

- `pnpm lint` — lint sur tous les packages/apps
- `pnpm typecheck` — vérification TypeScript sur tous les packages/apps
- `pnpm test` — tests sur tous les packages/apps
- `pnpm build:web` — build de production du site web

## Sécurité

Row Level Security est activée sur **toutes** les tables Supabase — un
mariage privé n'est jamais accessible à un utilisateur non autorisé. Ne
jamais considérer les contrôles frontend comme une protection suffisante ;
toute nouvelle table doit avoir RLS + policies avant d'être utilisée.
