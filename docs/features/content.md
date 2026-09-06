# Feature — `content`

**Statut : ⬜ À faire.** Phase 6 — Admin (back-office).

## Objet

Gestion des textes éditables de chaque page publique (`PageSection`), avec historique de
versions (`PageSectionVersion`) permettant un rollback. C'est le backend de la demande
explicite "manage all texts and images in the website" pour la partie textes (la partie
images est portée par `media`).

## Emplacement Clean Architecture

`apps/api/src/content/`

```
domain/
  entities/page-section.entity.ts
  repositories/page-section.repository.ts    → IPageSectionRepository
  value-objects/content-status.vo.ts
application/
  use-cases/
    list-sections.use-case.ts
    get-section.use-case.ts        → toutes locales d'une section (page, sectionKey)
    save-section-draft.use-case.ts → crée systématiquement une PageSectionVersion avant d'écrire
    publish-section.use-case.ts
    list-section-versions.use-case.ts
    restore-section-version.use-case.ts
  dtos/
infrastructure/
  repositories/prisma-page-section.repository.ts
  mappers/page-section.mapper.ts
presentation/
  controllers/page-sections.controller.ts
  guards/roles.guard.ts    → @Roles('MANAGER', 'ADMIN') sur toutes les routes d'écriture
__tests__/
  unit/save-section-draft.use-case.spec.ts
  unit/restore-section-version.use-case.spec.ts
  integration/page-sections.controller.spec.ts   → inclut un test 403 pour un rôle CLIENT
```

## Modèles Prisma

`PageSection` (unique sur `page, sectionKey, locale`), `PageSectionVersion` (`snapshotJson`
+ `editedById`), `Media` (relation optionnelle par section), `User` (auteur).

## Cas d'usage clés

- Lister les sections éditables groupées par page, avec statut (`DRAFT`/`PUBLISHED` — enum
  `ContentStatus`)
- Charger/éditer une section pour une locale (`Locale.FR`/`Locale.MG`)
- Sauvegarder un brouillon : **toujours** créer une `PageSectionVersion` (snapshot complet)
  avant d'écraser `PageSection`
- Publier une section (transition explicite, jamais implicite à la sauvegarde)
- Consulter l'historique et restaurer une version antérieure

## Endpoints exposés

| Méthode | Route | Use-case | Auth |
| --- | --- | --- | --- |
| `GET` | `/api/content/sections` | `list-sections` | `MANAGER`/`ADMIN` (écriture) — lecture publique via un endpoint séparé consommé par les pages publiques |
| `GET` | `/api/content/sections/:page/:sectionKey` | `get-section` | `MANAGER`/`ADMIN` |
| `PATCH` | `/api/content/sections/:page/:sectionKey` | `save-section-draft` | `MANAGER`/`ADMIN` |
| `POST` | `/api/content/sections/:page/:sectionKey/publish` | `publish-section` | `MANAGER`/`ADMIN` |
| `GET` | `/api/content/sections/:id/versions` | `list-section-versions` | `MANAGER`/`ADMIN` |
| `POST` | `/api/content/sections/:id/versions/:versionId/restore` | `restore-section-version` | `MANAGER`/`ADMIN` |

> Les pages publiques (Phase 1) lisent le contenu publié via un endpoint public dédié
> (ex. `GET /api/content/public/:page`, statut `PUBLISHED` uniquement) — à ajouter par ce
> module en Phase 6, les pages Phase 1 utilisant des valeurs par défaut en dur jusque-là
> (voir `docs/pages/home.md`).

## Points d'intégration

- **`media`** : le champ `PageSection.mediaId` référence un objet déjà uploadé via la
  médiathèque — ce module ne gère pas l'upload lui-même.
- **`users`** : `editedById`/`updatedById` référencent `User`, RBAC vérifié via le guard
  partagé avec `users`.
- **Pages consommatrices** : `admin-gestion-contenu` (édition), et potentiellement toutes
  les pages publiques une fois migrées (voir note ci-dessus).

## Points d'attention

- Ne jamais publier une section sans version de secours : `save-section-draft` doit être
  transactionnel (Prisma `$transaction`) entre l'insertion de `PageSectionVersion` et la
  mise à jour de `PageSection`.
- Un rôle `CLIENT`/`COUTURIERE` doit recevoir un 403 explicite sur toutes les routes de ce
  module (sauf le futur endpoint public en lecture seule).

## Vérification

- [ ] `save-section-draft` crée bien une version avant chaque écrasement (test dédié)
- [ ] `restore-section-version` restaure exactement le `snapshotJson` de la version choisie
- [ ] Guard RBAC testé : 403 pour `CLIENT`, 200 pour `MANAGER`/`ADMIN`
- [ ] `docs/checklist-implementation.md` : `content` passé à ✅
