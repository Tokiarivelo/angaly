# Feature — `content`

**Statut : ✅ Fait** (session 2026-09-16, complétée le même jour avec l'endpoint public).
Phase 6 — Admin (back-office).

## Objet

Gestion des textes éditables de chaque page publique (`PageSection`), avec historique de
versions (`PageSectionVersion`) permettant un rollback. C'est le backend de la demande
explicite "manage all texts and images in the website" pour la partie textes (la partie
images est portée par `media`).

## Écarts assumés par rapport au plan initial de cette fiche

- **Endpoint public de lecture ajouté dans une session suivante** (2026-09-16, suite) : la
  fiche prévoyait à terme un `GET /api/content/public/:page`. Il existe désormais —
  `GET /content/public/:page` (voir "Endpoint public" ci-dessous) — et `home`/`a-propos`/
  `la-une` (3 des 14 pages Phase 1) le consomment. Les 11 autres pages de la Phase 1 restent
  sur leurs littéraux codés en dur ; l'étape 4 de `docs/phases/phase-6-admin-cms.md` ("brancher
  les pages publiques") reste donc en cours, pas terminée — "migration progressive, pas un
  big-bang", une page à la fois.
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
    page-section-version-response.dto.ts, save-section-draft.dto.ts, publish-section.dto.ts,
    public-page-section-response.dto.ts, list-published-sections-query.dto.ts
  use-cases/
    list-sections.use-case.ts        → groupe par page puis par sectionKey (toutes locales confondues)
    get-section.use-case.ts          → toutes locales existantes d'une section
    save-section-draft.use-case.ts   → status forcé à DRAFT, délègue le snapshot au repository
    publish-section.use-case.ts      → status → PUBLISHED sans toucher au contenu, 404 si aucun brouillon n'existe encore
    list-section-versions.use-case.ts
    restore-section-version.use-case.ts → 404 si la version n'appartient pas à la section
    list-published-sections.use-case.ts → PUBLISHED-only, seul use-case public (pas de guard)
infrastructure/
  repositories/prisma-page-section.repository.ts → saveWithSnapshot()/restoreVersion() en Prisma $transaction,
                                                     findPublished() (status: PUBLISHED, +locale optionnel)
  mappers/page-section.mapper.ts → toPublicResponseDto() : pas de status/updatedById dans la réponse publique
presentation/
  controllers/page-sections.controller.ts        → @Controller('content/sections'), JwtAuthGuard+RolesGuard+@Roles(MANAGER, ADMIN)
  controllers/public-page-sections.controller.ts → @Controller('content/public'), AUCUN guard — voir "Endpoint public"
content.module.ts                             → importe AuthModule (guards), PrismaModule
__tests__/
  unit/page-section.entity.spec.ts, page-section.mapper.spec.ts, list-sections.use-case.spec.ts,
       get-section.use-case.spec.ts, save-section-draft.use-case.spec.ts, publish-section.use-case.spec.ts,
       list-section-versions.use-case.spec.ts, restore-section-version.use-case.spec.ts,
       list-published-sections.use-case.spec.ts, prisma-page-section.repository.spec.ts
  integration/page-sections.controller.spec.ts         → 200/401/403/400/201, snapshot-before-write couvert au niveau repository
  integration/public-page-sections.controller.spec.ts  → 200 sans Authorization, filtre ?locale=, 400 sur locale invalide,
                                                           réponse ne contient jamais status/updatedById
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

## Endpoint public

| Méthode | Route | Use-case | Auth |
| --- | --- | --- | --- |
| `GET` | `/api/content/public/:page` | `list-published-sections` | **aucune** (public) |

- **Contrôleur dédié et séparé** (`PublicPageSectionsController`, `content/public`) — jamais
  ajouté à `PageSectionsController` (`content/sections`), qui reste entièrement
  `MANAGER`/`ADMIN`-only au niveau classe. Séparer les deux contrôleurs rend impossible
  d'oublier un `@Roles()` sur une route censée rester privée.
- **`PUBLISHED`-only, garanti au niveau repository** : `list-published-sections.use-case.ts`
  délègue à `IPageSectionRepository.findPublished(page, locale?)`, une méthode dédiée
  (`where: { page, status: 'PUBLISHED', ...locale }`) — jamais `listAll`/`findAllLocales`
  (utilisées par `list-sections`/`get-section`, qui renvoient aussi les `DRAFT`). C'est le
  point de sécurité critique de cet endpoint, couvert par des tests dédiés à 3 niveaux
  (repository, use-case, controller integration) qui vérifient explicitement qu'aucune ligne
  `DRAFT` ne peut en sortir.
- **Filtrage par locale** : `?locale=FR|MG` optionnel (`ListPublishedSectionsQueryDto`,
  validé par `class-validator`, 400 si invalide — même pattern que
  `PublishSectionDto`/`SaveSectionDraftDto`). Sans le paramètre, l'endpoint renvoie **toutes**
  les locales publiées pour la page (comportement par défaut) ; avec, il filtre à une seule
  locale. Pas de résolution automatique via `@CurrentLocale()`/`i18n` (qui retomberait
  toujours sur `FR` par défaut et masquerait silencieusement les lignes `MG`) — le choix de
  filtrer ou non reste explicite côté appelant. Les deux pages consommatrices actuelles
  (`home`, `a-propos`) appellent sans `?locale=` et sélectionnent `FR` côté hook, le site
  n'ayant pour l'instant aucune bascule de langue (voir `docs/pages/home.md`).
- **Réponse volontairement plus étroite que `PageSectionResponseDto`** :
  `PublicPageSectionResponseDto` omet `status` (toujours `PUBLISHED` par construction ici) et
  `updatedById` (identifiant interne d'un compte staff, aucune raison de le rendre public) —
  voir `PageSectionMapper.toPublicResponseDto()`.

## Points d'intégration

- **`media`** : `PageSection.mediaId` référence un objet déjà uploadé via la médiathèque
  (`admin-mediatheque`) — ce module ne gère pas l'upload lui-même, seul le champ `mediaId` est
  écrit/lu.
- **`users`**/**`auth`** : réutilise directement `JwtAuthGuard`/`RolesGuard`/`@Roles()` depuis
  `auth/presentation/...` (voir docs/features/users.md pour pourquoi il n'y a pas de nouvelle
  indirection `shared/`).
- **Pages consommatrices** : `admin-gestion-contenu` (édition, endpoints `content/sections`).
  `home`, `a-propos` et `la-une` (lecture publique, endpoint `content/public/:page`) — 3 pages
  sur les 14 de la Phase 1, voir `docs/pages/home.md`/`docs/pages/a-propos.md`/
  `docs/pages/la-une.md` et l'écart ci-dessus. Les 11 autres pages publiques restent à migrer.

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
- [x] `GET /content/public/:page` testé pour ne jamais renvoyer de section `DRAFT` (repository,
      use-case, controller integration) et pour n'exiger aucune `Authorization`
- [x] `home`/`a-propos`/`la-une` lisent réellement `PageSection` côté public (react-query,
      `useHomeContent`/`useAProposContent`/`useLaUneContent`), avec repli testé sur les
      littéraux codés en dur pour toute section absente/`DRAFT`
