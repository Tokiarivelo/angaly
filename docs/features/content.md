# Feature — `content`

**Statut : ✅ Fait** (session 2026-09-16). Phase 6 — Admin (back-office).

## Objet

Gestion des textes éditables de chaque page publique (`PageSection`), avec historique de
versions (`PageSectionVersion`) permettant un rollback. C'est le backend de la demande
explicite "manage all texts and images in the website" pour la partie textes (la partie
images est portée par `media`).

## Écarts assumés par rapport au plan initial de cette fiche

- **Pas d'endpoint public de lecture dans cette passe** : la fiche prévoyait à terme un
  `GET /api/content/public/:page` pour que les pages Phase 1 lisent leur contenu publié.
  L'étape 4 de `docs/phases/phase-6-admin-cms.md` ("brancher les pages publiques") est
  explicitement hors périmètre de cette session ("migration progressive, pas un big-bang") —
  toutes les routes de ce module sont donc `MANAGER`/`ADMIN`-only, y compris les lectures.
  L'endpoint public reste à ajouter par une session future qui migrera réellement une
  première page.
- **Statut à 2 valeurs, pas 3** : `stitch-prompts/31-*.md` décrit trois pastilles (Publié /
  Brouillon / Modifications non publiées) mais `PageSection.status` (schema.prisma) est un
  simple `ContentStatus` (`DRAFT`/`PUBLISHED`) par ligne locale — pas de copie séparée
  brouillon/publiée. `save-section-draft` écrit donc directement la ligne avec `status =
  DRAFT`, `publish-section` la fait passer à `PUBLISHED` sans changer son contenu. Le
  troisième état ("il existe des modifications non publiées") impliquerait un schéma à deux
  copies (brouillon + publiée) par section/locale — changement de modèle hors périmètre
  d'une session sans migration prévue. Documenté aussi dans
  `docs/pages/admin-gestion-contenu.md`.
- **Résumé de section groupé par (page, sectionKey)** : `GET /api/content/sections` fusionne
  les lignes FR/MG d'une même section en une seule entrée pour l'écran (liste de gauche), en
  gardant la trace de quelles locales existent (`locales: Locale[]`) — le statut affiché est
  celui de la ligne FR quand elle existe (repli sur la première locale trouvée sinon), une
  simplification documentée plutôt qu'un choix arbitraire silencieux.

## Emplacement Clean Architecture

`apps/api/src/content/`

```
domain/
  entities/page-section.entity.ts            → invariants (page/sectionKey non vides, locale/status connus), toSnapshot()
  entities/page-section-version.entity.ts     → snapshot immuable
  repositories/page-section.repository.ts     → IPageSectionRepository (zéro import Prisma)
  value-objects/content-status.vo.ts          → mirrors locaux de ContentStatus/Locale
application/
  dtos/
    page-section-response.dto.ts, page-section-group-response.dto.ts,
    page-section-version-response.dto.ts, save-section-draft.dto.ts, publish-section.dto.ts
  use-cases/
    list-sections.use-case.ts        → groupe par page puis par sectionKey (toutes locales confondues)
    get-section.use-case.ts          → toutes locales existantes d'une section
    save-section-draft.use-case.ts   → status forcé à DRAFT, délègue le snapshot au repository
    publish-section.use-case.ts      → status → PUBLISHED sans toucher au contenu, 404 si aucun brouillon n'existe encore
    list-section-versions.use-case.ts
    restore-section-version.use-case.ts → 404 si la version n'appartient pas à la section
infrastructure/
  repositories/prisma-page-section.repository.ts → saveWithSnapshot()/restoreVersion() en Prisma $transaction
  mappers/page-section.mapper.ts
presentation/
  controllers/page-sections.controller.ts    → @Controller('content/sections'), JwtAuthGuard+RolesGuard+@Roles(MANAGER, ADMIN)
content.module.ts                             → importe AuthModule (guards), PrismaModule
__tests__/
  unit/page-section.entity.spec.ts, page-section.mapper.spec.ts, list-sections.use-case.spec.ts,
       get-section.use-case.spec.ts, save-section-draft.use-case.spec.ts, publish-section.use-case.spec.ts,
       list-section-versions.use-case.spec.ts, restore-section-version.use-case.spec.ts,
       prisma-page-section.repository.spec.ts
  integration/page-sections.controller.spec.ts  → 200/401/403/400/201, snapshot-before-write couvert au niveau repository
```

## Modèles Prisma

`PageSection` (unique sur `page, sectionKey, locale`), `PageSectionVersion` (`snapshotJson`
+ `editedById`), `Media` (relation optionnelle par section, gérée par `media`), `User`
(auteur, `updatedById`/`editedById`).

## Cas d'usage clés

- Lister les sections éditables groupées par page (résumé par sectionKey, toutes locales)
- Charger toutes les locales existantes d'une section (`GET .../:page/:sectionKey`)
- Sauvegarder un brouillon pour une locale : **toujours** snapshot de l'état précédent de la
  ligne dans `PageSectionVersion` avant écrasement, dans la même transaction Prisma
  (`PrismaPageSectionRepository.saveWithSnapshot`) — non négociable, voir
  `docs/phases/phase-6-admin-cms.md` "Points d'attention"
- Publier une section pour une locale (action explicite, jamais implicite à la sauvegarde) —
  échoue en 404 si aucun brouillon n'a jamais été enregistré pour cette locale
- Consulter l'historique d'une section (par `PageSection.id`) et restaurer une version
  antérieure — la restauration snapshot elle-même l'état courant avant d'appliquer l'ancien,
  pour rester elle-même annulable

## Endpoints exposés

| Méthode | Route | Use-case | Auth |
| --- | --- | --- | --- |
| `GET` | `/api/content/sections` | `list-sections` | `MANAGER`/`ADMIN` |
| `GET` | `/api/content/sections/:id/versions` | `list-section-versions` | `MANAGER`/`ADMIN` |
| `POST` | `/api/content/sections/:id/versions/:versionId/restore` | `restore-section-version` | `MANAGER`/`ADMIN` |
| `GET` | `/api/content/sections/:page/:sectionKey` | `get-section` | `MANAGER`/`ADMIN` |
| `PATCH` | `/api/content/sections/:page/:sectionKey` | `save-section-draft` | `MANAGER`/`ADMIN` |
| `POST` | `/api/content/sections/:page/:sectionKey/publish` | `publish-section` | `MANAGER`/`ADMIN` |

> Ordre de déclaration important côté `PageSectionsController` : les deux routes
> `:id/versions` doivent être déclarées **avant** `:page/:sectionKey` — sinon Nest/Express
> matcherait `GET /content/sections/{id}/versions` avec le handler `get-section`
> (`page={id}`, `sectionKey="versions"`) au lieu du bon.

## Points d'intégration

- **`media`** : `PageSection.mediaId` référence un objet déjà uploadé via la médiathèque
  (`admin-mediatheque`) — ce module ne gère pas l'upload lui-même, seul le champ `mediaId` est
  écrit/lu.
- **`users`**/**`auth`** : réutilise directement `JwtAuthGuard`/`RolesGuard`/`@Roles()` depuis
  `auth/presentation/...` (voir docs/features/users.md pour pourquoi il n'y a pas de nouvelle
  indirection `shared/`).
- **Pages consommatrices** : `admin-gestion-contenu` (édition). Aucune page publique ne migre
  encore vers ce module (voir écarts ci-dessus).

## Points d'attention

- `saveWithSnapshot`/`restoreVersion` sont chacun un seul `$transaction` Prisma — jamais deux
  requêtes séparées, pour qu'un crash entre le snapshot et l'écrasement ne puisse jamais se
  produire.
- La contrainte `@@unique([page, sectionKey, locale])` impose une ligne par langue — chaque
  écriture doit préciser explicitement quelle `locale` elle cible, il n'existe pas de notion
  de "toutes les locales" pour `save-section-draft`.

## Vérification

- [x] `save-section-draft`/`saveWithSnapshot` crée bien une version avant chaque écrasement
      (tests dédiés unit + repository)
- [x] `restore-section-version` restaure exactement le `snapshotJson` choisi, et snapshotte
      l'état pré-restauration
- [x] Guard RBAC testé : 403 pour `CLIENT`/`COUTURIERE`, 401 sans token, 200 pour `MANAGER`
- [x] `pnpm --filter @angaly/api test` et `typecheck` verts pour ce module
- [x] `docs/checklist-implementation.md` : `content` passé à ✅
