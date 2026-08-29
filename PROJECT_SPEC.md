# Wedding Univers — Spécification produit (V1)

> Résumé opérationnel du cahier des charges fourni par le client. En cas de
> divergence, le cahier des charges original (conversation d'origine) fait
> foi ; ce document sert de référence de travail pour le développement.

## Positionnement

**Wedding Univers** est la plateforme qui réunit tout l'univers du mariage.
Le **Projet Mariage** est l'objet central : ce n'est ni un simple annuaire,
ni uniquement un réseau social, ni uniquement un wedding planner.

## Principes fondamentaux (non négociables)

1. **Le mariage est le centre** — tout gravite autour du Projet Mariage.
2. **Pas d'IA gadget** — le moteur de recommandation (Wedding Match) est
   algorithmique et configurable en V1. L'architecture doit permettre
   d'ajouter de l'IA plus tard *si elle apporte une réelle valeur*, jamais
   par défaut.
3. **Mobile-first** — l'expérience doit être excellente sur smartphone.
4. **Design premium** — élégance + émotion + modernité + confiance, jamais
   l'apparence d'un logiciel de gestion classique.
5. **Simplicité** — un couple doit comprendre immédiatement quoi faire.

## Utilisateurs

- **Couple** — crée ou rejoint un Projet Mariage, invite des collaborateurs.
- **Professionnel** — dispose d'une vitrine publique (profil, portfolio,
  prestations, tarifs, zone d'intervention, disponibilités) et reçoit des
  demandes de couples correspondant à son activité.

## Fonctionnalités V1 (résumé par domaine)

| Domaine | Contenu |
|---|---|
| Création du mariage | Prénoms, date (flexible ou non), lieu (connu ou non), invités, budget, style, cérémonie, ambiance, gamme |
| Dashboard | Progression, budget, prochaines tâches, recommandations, activité |
| Organisation & planning | Tâches catégorisées, statuts (à faire / en cours / terminé), vue liste/calendrier/échéances, **checklist par défaut générée par des règles configurables (pas d'IA)** |
| Budget | Budget global, postes (prévu/dépensé), calculs dérivés (total, dépensé, restant, engagé, % utilisé) |
| Invités | Liste, groupes (famille/amis/collègues/témoins/autres), présence, accompagnant, enfants, repas, hébergement |
| Équipe | Collaborateurs avec rôles et permissions (construit dès le départ) |
| Prestataires | Page publique, catégories hiérarchiques, portfolio, prestations/tarifs, zone d'intervention |
| Recherche | Filtres catégorie/localisation/distance/prix/style/disponibilité/avis/gamme |
| Favoris | Prestataires, portfolios, photos, lieux, inspirations — par mariage |
| **Wedding Match** | Score de compatibilité pondéré et **explicable** (jamais un pourcentage nu) ; poids configurables ; matching inverse (opportunités côté pro) |
| Écosystème prestataires | Graphe de collaborations entre professionnels (préparé en base, pas forcément affiché) |
| Inspirations | Collections thématiques (déco, robe, fleurs, lieu…) |
| Social (structure V1) | Publications, likes, commentaires — structure préparée, pas mise en avant |
| Mariages réels | Page publique optionnelle d'un mariage, avec prestataires identifiés |
| Messagerie | Couple ↔ Professionnel ; architecture prête pour devis/réservation/contrat/paiement futurs |
| Notifications | Web (internes) + mobile (push) |

## Wedding Match — pondération par défaut (§16)

| Critère | Poids |
|---|---|
| Budget | 20% |
| Localisation | 15% |
| Disponibilité | 20% |
| Style | 15% |
| Type de mariage | 10% |
| Capacité | 5% |
| Expérience | 5% |
| Avis | 5% |
| Préférences | 5% |

Chaque recommandation doit expliquer ses raisons principales (ex : "✓ budget
compatible", "✓ disponible à votre date", "✓ 32 km de votre lieu") —
implémenté dans `packages/matching`.

## Hors périmètre V1 (volontairement)

Paiement, réservation intégrée, contrats numériques, devis automatisés
complexes, abonnement professionnel, publicité, marketplace transactionnelle,
IA conversationnelle, machine learning, algorithme social complexe,
fonctionnalités "waouh" sans valeur produit.

## Stack technique

- **Web** : Next.js (App Router) + TypeScript
- **Mobile** : React Native + Expo + TypeScript
- **Backend** : Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Sécurité** : PostgreSQL Row Level Security partout, aucune donnée privée
  de mariage accessible à un utilisateur non autorisé, aucun secret exposé
  côté client
- **Code** : monorepo pnpm workspaces (voir `README.md` pour l'arborescence)

## Roadmap (macro)

V0 Fondation → V1 Projet Mariage → V1.5 Prestataires → V2 Wedding Match →
V2.5 Communication → V3 Social → V4 Marketplace → V5 Intelligence.

Découpage MVP détaillé : PHASE 0 (architecture) → PHASE 1 (auth/profils) →
PHASE 2 (création du mariage) → PHASE 3 (dashboard) → PHASE 4
(tâches/planning) → PHASE 5 (budget) → PHASE 6 (invités) → PHASE 7
(collaborateurs) → PHASE 8 (profils pro) → PHASE 9 (recherche/filtres) →
PHASE 10 (portfolio) → PHASE 11 (Wedding Match) → PHASE 12
(favoris/contact) → PHASE 13 (messagerie) → PHASE 14 (notifications) →
PHASE 15 (mobile) → PHASE 16 (tests/sécurité/optimisation).

## Méthode de travail imposée

> ANALYSER → PLANIFIER → CONSTRUIRE → TESTER → CORRIGER → DOCUMENTER →
> COMMIT → CONTINUER

Ne jamais construire toute l'application en une fois. Une phase à la fois,
avec mise à jour de `PROJECT_STATUS.md` et `CHANGELOG.md` à chaque étape.
