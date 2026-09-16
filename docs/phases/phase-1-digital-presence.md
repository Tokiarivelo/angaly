# Phase 1 — Présence digitale

**Statut : ✅ Complète (14 pages, 8 modules).** Dépend de : Phase 0 (fondation). Les 14
pages lisent désormais leur texte éditorial depuis `PageSection` (Phase 6, item 4) plutôt
que des littéraux codés en dur — voir `docs/phases/phase-6-admin-cms.md`.

## Objectif (spec §101, Phase 1)

Construire l'image de marque et la présence en ligne d'ANGALY : vitrine, réalisations,
collections, journal, à propos, ateliers, contact — entièrement publique, sans compte
client (l'authentification arrive en Phase 2). SEO et multilingue (FR/MG) posés dès cette
phase, pas ajoutés après coup.

## Pages en scope

| Page | Fiche |
| --- | --- |
| home | `docs/pages/home.md` |
| la-une | `docs/pages/la-une.md` |
| nos-creations-galerie | `docs/pages/nos-creations-galerie.md` |
| creation-detail | `docs/pages/creation-detail.md` |
| collections-liste | `docs/pages/collections-liste.md` |
| collection-detail | `docs/pages/collection-detail.md` |
| a-propos | `docs/pages/a-propos.md` |
| nos-ateliers-liste | `docs/pages/nos-ateliers-liste.md` |
| atelier-detail | `docs/pages/atelier-detail.md` |
| contact | `docs/pages/contact.md` |
| journal-liste | `docs/pages/journal-liste.md` |
| journal-article | `docs/pages/journal-article.md` |
| page-404 | `docs/pages/page-404.md` |
| navigation-mobile | `docs/pages/navigation-mobile.md` |

## Modules backend en scope

`creations`, `collections`, `ateliers`, `blog`, `media`, `i18n`, `search` — voir
`docs/features/<slug>.md` pour chacun.

## Ordre suggéré

1. `media` (tout le reste dépend de pouvoir servir des images depuis MinIO)
2. `i18n` (structure de traduction FR/MG posée avant d'écrire du contenu)
3. `creations`, `collections`, `ateliers`, `blog` (CRUD lecture seule — l'admin CMS arrive
   en Phase 6)
4. `search` (dépend des quatre précédents pour avoir quelque chose à indexer)
5. Pages, dans l'ordre : `home` → `la-une` → `nos-creations-galerie` → `creation-detail` →
   `collections-liste` → `collection-detail` → `a-propos` → `nos-ateliers-liste` →
   `atelier-detail` → `journal-liste` → `journal-article` → `contact` → `page-404` →
   `navigation-mobile` (composants globaux, en dernier car réutilisés par toutes les pages
   précédentes — les construire tôt en `ui/` mais les finaliser une fois toutes les routes
   connues)

## Hors scope (renvoyé à une phase ultérieure)

- Tout ce qui nécessite un compte client (favoris réels, personnalisation) → Phase 2
- Panier/checkout → Phase 3
- Angaly Pattern Studio → Phase 4
- Édition du contenu depuis un back-office → Phase 6 (le contenu de cette phase est saisi
  directement en base via `db.seed`/Prisma Studio en attendant)

## Vérification de sortie de phase

- Les 14 pages listées sont accessibles, chacune conforme à sa maquette Stitch
- `docs/checklist-implementation.md` : les 14 pages + 7 modules passés à ✅
- Tests unitaires + au moins un test e2e Playwright critique (parcours de découverte :
  accueil → une création → une collection)
- Chaque page a un `<title>`/meta description (spec §70), et le sélecteur de langue
  FR/MG est fonctionnel sur au moins le footer

## Phase suivante

`docs/phases/phase-2-conversion.md`.
