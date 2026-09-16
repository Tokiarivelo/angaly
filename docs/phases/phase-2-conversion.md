# Phase 2 — Conversion

**Statut : ✅ Complète (11 pages, 6 modules).** Dépend de : Phase 1 (creations/products
doivent exister pour être personnalisés/achetés/réservés).

## Objectif (spec §101, Phase 2)

Transformer les visiteurs en prospects/clients : compte client, prise de rendez-vous,
catalogue prêt-à-porter avec réservation, favoris, devis. C'est la phase qui introduit
l'authentification.

## Pages en scope

| Page | Fiche |
| --- | --- |
| authentification | `docs/pages/authentification.md` |
| personnalisation-creation | `docs/pages/personnalisation-creation.md` |
| sur-mesure-process | `docs/pages/sur-mesure-process.md` |
| demande-sur-mesure | `docs/pages/demande-sur-mesure.md` |
| devis | `docs/pages/devis.md` |
| prendre-rendez-vous | `docs/pages/prendre-rendez-vous.md` |
| confirmation-rendez-vous | `docs/pages/confirmation-rendez-vous.md` |
| pret-a-porter-catalogue | `docs/pages/pret-a-porter-catalogue.md` |
| fiche-produit | `docs/pages/fiche-produit.md` |
| reservation-essayage | `docs/pages/reservation-essayage.md` |
| mes-favoris | `docs/pages/mes-favoris.md` |

## Modules backend en scope

`auth`, `customers`, `appointments`, `products`, `quotes`, `reviews`.

## Ordre suggéré

1. `auth` (RS256 JWT, cookie httpOnly, NextAuth côté web — voir ADR-001 dans
   `docs/architecture.md`) + page `authentification`
2. `customers` (profil créé à l'inscription ; porte aussi les favoris, voir modèle
   `Favorite` dans `packages/database/prisma/schema.prisma`)
3. `products` (catalogue + fiche produit) → pages `pret-a-porter-catalogue`, `fiche-produit`
4. `appointments` (calendrier de disponibilité) → pages `prendre-rendez-vous`,
   `confirmation-rendez-vous`, `reservation-essayage`
5. `quotes` → pages `sur-mesure-process`, `demande-sur-mesure`, `devis`,
   `personnalisation-creation` (le dossier de conception créé par la personnalisation
   alimente une demande de devis)
6. `reviews` (témoignages/avis affichés sur `home` en Phase 1 — les rendre dynamiques
   maintenant que des clients existent) → page `mes-favoris` en dernier (dépend de
   `customers` + `products`/`creations`)

## Points d'attention

- Le formulaire `demande-sur-mesure` est volontairement multi-étapes (spec §98 — le moins de
  friction possible) : ne pas revenir à un formulaire long en une page.
- `prendre-rendez-vous` est le CTA principal du site (spec §99) — son parcours doit rester
  sous la minute (spec §14 palette + §98).

## Vérification de sortie de phase

- Un visiteur peut créer un compte, se connecter, réserver un essayage, prendre rendez-vous,
  et faire une demande sur mesure de bout en bout (e2e Playwright)
- `docs/checklist-implementation.md` : les 11 pages + 6 modules passés à ✅
- RBAC posé (`Role` : CLIENT à ce stade — COUTURIERE/MANAGER/ADMIN arrivent utilement en
  Phase 6, mais l'enum existe déjà depuis Phase 0)

## Phase suivante

`docs/phases/phase-3-production.md`.
