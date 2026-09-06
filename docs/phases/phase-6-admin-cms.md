# Phase 6 — Back-office & CMS

**Statut : ⬜ À faire.** Dépend de : Phase 1 (`creations`, `collections`, `ateliers`,
`blog`, `media`) — le CMS édite du contenu qui doit déjà exister en base.

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
   section, pas un big-bang sur toutes les pages en une fois

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

- Un compte `ADMIN` peut modifier le texte d'une section de la page `home` et voir le
  changement se refléter côté public sans déploiement
- Un compte `ADMIN` peut uploader une image dans la médiathèque et l'utiliser sur une fiche
  `creation` existante
- `docs/checklist-implementation.md` : les 2 pages + 2 modules passés à ✅
- Toutes les phases (0 à 6) sont maintenant à ✅ dans `docs/checklist-implementation.md`

## Phase suivante

Aucune — dernière phase du plan initial. Toute extension future (multi-devise, marketplace,
app mobile, etc.) doit être documentée comme une nouvelle phase 7+ avant d'être codée, en
suivant `.cursor/rules/006-phase-workflow.mdc`.
