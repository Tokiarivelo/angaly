# Phase 6 — Back-office & CMS

**Statut : ✅ Fait pour les 3 premiers items de l'"Ordre suggéré" ci-dessous** (session
2026-09-16) : `users` (backend), `content` + `admin-gestion-contenu`, `admin-mediatheque`.
**L'item 4 est en cours** (démarré session 2026-09-16, suite) : `GET /content/public/:page`
(public, `PUBLISHED`-only) ajouté, et les pages `home`/`a-propos`/`la-une`/
`nos-creations-galerie` — 4 pages sur les 14 de la Phase 1 — lisent désormais leur texte
depuis `PageSection` avec repli sur les littéraux codés en dur pour toute section pas encore
éditée dans le CMS (`la-une` et `nos-creations-galerie` ajoutées dans des sessions
ultérieures, voir `docs/pages/la-une.md`/`docs/pages/nos-creations-galerie.md`). **Les 10
autres pages de la Phase 1 restent non migrées** (`contact`, `creation-detail`, etc.) —
migration progressive, une session à la fois, comme annoncé dès l'origine de cet item.
Dépend de : Phase 1 (`creations`, `collections`, `ateliers`, `blog`, `media`) — le CMS édite
du contenu qui doit déjà exister en base.

**Réserves à connaître avant d'utiliser/étendre cette phase** (détail dans
`docs/features/users.md`, `docs/features/content.md`, `docs/features/media.md`,
`docs/pages/admin-gestion-contenu.md`, `docs/pages/admin-mediatheque.md`) :
1. Aucune vérification Stitch réelle n'a été possible dans cette session (`mcp__stitch__*` en
   échec d'auth, `agy` absent) — les 2 pages sont construites depuis le texte de
   `stitch-prompts/31-*.md` uniquement, pas depuis l'écran rendu.
2. `admin-mediatheque`'s panneau "Utilisée dans" et le blocage de suppression sont limités par
   un bug pré-existant (2026-09-07, non corrigé) : `confirm-upload`/`upload-media-buffer` ne
   connectent jamais la relation Prisma many-to-many que ces deux garde-fous lisent.
3. `users` livre uniquement le backend (API + tests) — pas de page dédiée, faute de maquette
   Stitch pour un écran de gestion des comptes staff dans le périmètre actuel.

## Objectif (spec §101 Phase 6, §76)

Donner à l'équipe ANGALY (rôles `MANAGER`/`ADMIN`) la capacité d'éditer tous les textes et
images du site sans intervention développeur : éditeur de sections de page et médiathèque
centralisée. C'est la fonctionnalité demandée explicitement en complément du reste du
projet ("manage all texts and images in the website").

## Pages en scope

| Page | Fiche |
| --- | --- |
| admin-gestion-contenu | `docs/pages/admin-gestion-contenu.md` |
| admin-mediatheque | `docs/pages/admin-mediatheque.md` |

## Modules backend en scope

`users` (gestion des rôles/comptes internes — CLIENT/COUTURIERE/MANAGER/ADMIN),
`content` (nouveau module, cf. `apps/api/src/modules/content/README.md` — porte
`PageSection`/`PageSectionVersion`).

## Ordre suggéré

1. `users` (RBAC réel pour `MANAGER`/`ADMIN` — jusqu'ici seul `CLIENT` était exercé) :
   guards NestJS par rôle, écran de gestion des comptes internes
2. `content` : CRUD sur `PageSection` (clé de section + locale + champs riches) et
   `PageSectionVersion` (historique, permet un rollback) → page `admin-gestion-contenu`
3. `admin-mediatheque` : parcours/upload/suppression des objets `Media` dans MinIO
   (réutilise `packages/storage`), recherche par bucket/tag/entité liée
4. Brancher les pages publiques (Phase 1) pour lire leur contenu texte depuis
   `PageSection` au lieu de littéraux codés en dur — migration progressive, section par
   section, pas un big-bang sur toutes les pages en une fois. **Première tranche faite**
   (session 2026-09-16, suite) : `home` et `a-propos` (2/14 pages Phase 1) — voir
   `docs/pages/home.md`, `docs/pages/a-propos.md`, `docs/features/content.md`. **Deuxième
   tranche faite** (session 2026-09-16, suite) : `la-une` (3/14 pages Phase 1) — voir
   `docs/pages/la-une.md`. **Troisième tranche faite** (session 2026-09-16, suite) :
   `nos-creations-galerie` (4/14 pages Phase 1) — voir `docs/pages/nos-creations-galerie.md`.
   Les 10 autres pages restent à migrer, une session à la fois.

## Points d'attention

- **Sécurité** : toutes les routes `content`/`media` d'écriture exigent `MANAGER` ou
  `ADMIN` — jamais `CLIENT`/`COUTURIERE`. Vérifier le guard à la fois côté NestJS
  (obligatoire) et masquer l'UI côté web (confort, pas une mesure de sécurité en soi).
- Toute suppression de média doit vérifier qu'il n'est plus référencé (`MediaEntityType` +
  entité liée) avant suppression physique dans MinIO — sinon lien cassé sur le site public.
- Versionner les sections de texte (`PageSectionVersion`) dès le premier commit du module
  — pas une amélioration a posteriori, car c'est le seul filet de sécurité contre une
  mauvaise édition en production par un non-développeur.

## Vérification de sortie de phase

- [x] Un compte `ADMIN` peut modifier le texte d'une section de la page `home` et voir le
  changement se refléter côté public sans déploiement — **atteint** (session 2026-09-16,
  suite) : `save-section-draft`/`publish-section` (déjà testés) plus le nouvel endpoint public
  `GET /content/public/accueil` (`PUBLISHED`-only) que `useHomeContent` consomme via
  react-query ; `a-propos` migré dans le même passage (`useAProposContent`,
  `GET /content/public/a-propos`) ; `la-une` et `nos-creations-galerie` migrées dans des
  sessions ultérieures (`useLaUneContent`/`GET /content/public/la-une`,
  `useGalleryContent`/`GET /content/public/nos-creations-galerie`). **Seulement 4 pages sur
  les 14 de la Phase 1** — les 10 autres restent sur leurs littéraux codés en dur (item 4,
  migration progressive non finie, voir statut en tête de fiche)
- ⚠️ Un compte `ADMIN` peut uploader une image dans la médiathèque et l'utiliser sur une fiche
  `creation` existante — l'upload et le lien direct (`entityType`/`entityId`) fonctionnent,
  mais le rattachement via la relation Prisma many-to-many que `creation.media` lit réellement
  n'est pas connecté par `confirm-upload` (bug pré-existant non corrigé, voir réserve 2
  ci-dessus) : l'image n'apparaîtrait donc pas automatiquement sur la fiche `creation` par ce
  seul upload en l'état
- [x] `docs/checklist-implementation.md` : les 2 pages + 2 modules passés à ✅
- ⬜ Toutes les phases (0 à 6) ne sont **pas encore** toutes à ✅ dans
  `docs/checklist-implementation.md` au sens strict de la phase — l'item 4 de l'"Ordre
  suggéré" (migration des pages publiques) est **en cours** (4/14 pages Phase 1 migrées :
  `home`, `a-propos`, `la-une`, `nos-creations-galerie`), pas terminé

## Phase suivante

Aucune — dernière phase du plan initial. Toute extension future (multi-devise, marketplace,
app mobile, etc.) doit être documentée comme une nouvelle phase 7+ avant d'être codée, en
suivant `.cursor/rules/006-phase-workflow.mdc`.
