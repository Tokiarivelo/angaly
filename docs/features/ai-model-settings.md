# Feature — `admin-ai-settings`

**Statut : ✅ Fait.** Ajout hors spécification initiale (session 2026-09-15), à la demande
explicite : « add developped model and train it with data... permit for admin to choose model ».

## Objet

Permet à un administrateur (`Role.ADMIN` uniquement) de choisir quel backend
`apps/ai-service` utilise pour **l'estimation des mesures manquantes** lors de la
génération d'un patron : `GEMINI` (API générative Gemini, grounded sur la table de
tailles standard) ou `LOCAL_STATISTICAL` (modèle statistique entraîné en interne —
voir « Le modèle entraîné » ci-dessous). Ce choix est un réglage global unique (une
seule ligne en base), lu par `ai-inference` à chaque estimation et jamais visible des
rôles `CLIENT`/`COUTURIERE`/`MANAGER`.

Ce module ne couvre volontairement **que** l'estimation de mesures : la suggestion de
coupe/détails (`suggest-pattern-parameters`) continue d'utiliser exclusivement Gemini,
faute de données réelles disponibles pour entraîner un classifieur de coupe sur des
labels qui seraient sinon fabriqués — voir « Pourquoi pas un modèle pour la coupe ? ».

## Le modèle entraîné (`LOCAL_STATISTICAL`)

- **Données** : [ANSUR II](https://www.openlab.psu.edu/ansur2/) (2012 Anthropometric
  Survey of U.S. Army Personnel, rendu public en 2017) — 4082 sujets masculins + 1986
  sujets féminins, 93 mesures anthropométriques réelles chacun. Téléchargé depuis le
  mirroir public GitHub `senihberkay/US-Army-ANSUR-II` (CSV bruts) dans
  `apps/ai-service/ml/data/raw/` (gitignored).
- **Modèle** : un `sklearn.impute.IterativeImputer` (régression chaînée type MICE,
  `BayesianRidge`) par genre, entraîné sur les 6 clés canoniques
  (`TOUR_POITRINE`, `TOUR_TAILLE`, `TOUR_BASSIN`, `LONGUEUR_DOS`, `CARRURE_DOS`,
  `TOUR_COU`) + taille + poids. À l'inférence, une ligne avec les mesures connues et
  `NaN` pour les manquantes est passée à `transform()`, qui prédit les valeurs
  manquantes à partir de celles connues — un vrai modèle statistique appris sur des
  données réelles, pas une recherche du plus proche voisin dans une table.
- **Entraînement** : `apps/ai-service/ml/scripts/train_measurement_model.py` — split
  train/test 80/20, évalue le MAE (erreur absolue moyenne) held-out par clé en masquant
  tour à tour chaque mesure. Résultats observés (session 2026-09-15, cm) :

  | Clé | MAE Homme | MAE Femme |
  | --- | --- | --- |
  | TOUR_POITRINE | 2.34 | 3.09 |
  | TOUR_TAILLE | 3.13 | 3.25 |
  | TOUR_BASSIN | 1.95 | 2.14 |
  | LONGUEUR_DOS | 1.54 | 1.42 |
  | CARRURE_DOS | 1.06 | 1.14 |
  | TOUR_COU | 1.13 | 0.89 |

  Le MAE par clé est persisté dans l'artefact et utilisé pour dériver un score de
  confiance honnête (`app/local_model.py`) plutôt qu'une constante arbitraire — toujours
  ≤ 0.6, donc toujours `isIndicativeOnly()` côté NestJS (`ConfidenceScore`).
- **Artefacts** : `apps/ai-service/ml/models/*.joblib` (gitignored, comme
  `ml/data/raw/`) — à régénérer via `python ml/scripts/train_measurement_model.py`
  après `pip install -r requirements.txt`. `app/local_model.py` charge ces artefacts au
  premier appel ; si absents, `LOCAL_STATISTICAL` est signalé indisponible
  (`GET /v1/models`) et toute requête y faisant appel retombe automatiquement sur
  Gemini (jamais d'erreur bloquante).

### Pourquoi pas un modèle pour la coupe ?

Un modèle pour `suggestedCutType` nécessiterait des paires (occasion, style, mesures) →
coupe réellement choisies par des clientes/couturières — aucune donnée publique de ce
type n'existe, et en fabriquer une (règles heuristiques déguisées en "labels") aurait
été malhonnête à présenter comme un modèle entraîné. Gemini reste donc la seule option
pour cette suggestion précise.

## Emplacement Clean Architecture

`apps/api/src/admin-ai-settings/`

```
domain/
  entities/ai-model-setting.entity.ts
  repositories/ai-model-setting.repository.ts → IAiModelSettingRepository
application/
  use-cases/
    get-ai-model-setting.use-case.ts
    update-ai-model-setting.use-case.ts
  dtos/update-ai-model-setting.dto.ts   → class-validator, @IsIn(['GEMINI','LOCAL_STATISTICAL'])
infrastructure/
  repositories/prisma-ai-model-setting.repository.ts → upsert sur une ligne singleton (id "singleton")
presentation/
  controllers/ai-model-settings.controller.ts → GET/PATCH /admin/ai-settings, @Roles(Role.ADMIN)
__tests__/
  unit/get-ai-model-setting.use-case.spec.ts
  unit/update-ai-model-setting.use-case.spec.ts
  unit/prisma-ai-model-setting.repository.spec.ts
  integration/ai-model-settings.controller.spec.ts
```

`ai-inference/presentation/controllers/ai-available-models.controller.ts`
(`GET /ai-inference/available-models`, ADMIN-only) proxie `apps/ai-service`'s
`GET /v1/models` pour indiquer quels backends sont réellement chargés — évite qu'un
admin sélectionne un modèle mort.

## Modèles Prisma

`AiModelSetting` (ligne singleton `id = "singleton"`, `measurementModel` — enum
`AiMeasurementModel { GEMINI | LOCAL_STATISTICAL }`, `updatedById` → `User?`,
`updatedAt`). Migration `20260915051500_add_ai_model_setting`.

## Endpoints exposés

| Méthode | Route | Use-case | Auth |
| --- | --- | --- | --- |
| `GET` | `/api/admin/ai-settings` | `get-ai-model-setting` | `ADMIN` |
| `PATCH` | `/api/admin/ai-settings` | `update-ai-model-setting` | `ADMIN` |
| `GET` | `/api/ai-inference/available-models` | proxy `apps/ai-service` `GET /v1/models` | `ADMIN` |

## Points d'intégration

- **`ai-inference`** : `EstimateMissingMeasurementsUseCase` importe `AdminAiSettingsModule`
  et lit `GetAiModelSettingUseCase.execute()` pour déterminer `modelPreference` par
  défaut à chaque appel (sauf si le DTO en fournit déjà un explicitement — utile pour
  les tests). Dépendance à sens unique (`ai-inference` → `admin-ai-settings`), aucun
  cycle : `admin-ai-settings` n'importe jamais `ai-inference`.
- **`apps/ai-service`** : `app/inference.py::estimate_missing_measurements` route vers
  `app/local_model.py` quand `modelPreference == "LOCAL_STATISTICAL"` et qu'un artefact
  est chargé pour le genre demandé ; sinon, log un avertissement et continue sur Gemini
  — jamais d'échec bloquant côté appelant.
- **Frontend** : `apps/web/src/features/admin-ai-settings/` (page `AiModelSettingsPage`,
  route `/admin/ai-settings`) + `apps/web/src/features/admin-dashboard/` (shell
  `AdminLayout`/`AdminSidebar`, page `/admin/dashboard`). Voir `docs/pages/admin-ai-settings.md`.

## Points d'attention

- **ADMIN-only, strictement** — `(admin)/layout.tsx` gate déjà `STAFF_ROLES`
  (COUTURIERE, MANAGER, ADMIN) pour le shell, mais `/admin/ai-settings` (page) et
  `/admin/ai-settings` (endpoint) re-vérifient `Role.ADMIN` explicitement : une
  couturière ou un manager ne doit jamais pouvoir changer ce réglage.
- **Jamais bloquant** : si `apps/ai-service` est injoignable, `getAvailableModels()`
  dégrade vers `{ measurementEstimation: ['GEMINI'] }` — l'écran admin affiche alors
  `LOCAL_STATISTICAL` comme indisponible plutôt que de planter.
- Le réglage n'affecte **que** l'estimation de mesures manquantes — il ne change jamais
  la génération géométrique elle-même (`packages/pattern-engine` reste déterministe et
  ignore totalement ce réglage), ni la suggestion de coupe (`suggest-pattern-parameters`,
  toujours Gemini).
- `ml/models/*.joblib` et `ml/data/raw/*.csv` sont gitignorés — un environnement qui n'a
  jamais exécuté `train_measurement_model.py` verra `LOCAL_STATISTICAL` marqué
  indisponible, ce qui est le comportement correct, pas un bug.

## Vérification

- [x] `get-ai-model-setting`/`update-ai-model-setting` testés (unit)
- [x] `prisma-ai-model-setting.repository` testé (upsert singleton)
- [x] Guard ADMIN-only testé sur les deux endpoints (403 pour un rôle insuffisant)
- [x] `EstimateMissingMeasurementsUseCase` testé : défaut = réglage admin, override explicite respecté
- [x] `app/local_model.py` testé (estimation, filtrage des clés, artefact absent → erreur gérée par l'appelant)
- [x] `apps/ai-service` : `LOCAL_STATISTICAL` demandé sans artefact → repli Gemini transparent (testé)
- [x] Frontend : `AiModelSettingsPage` teste la sélection, la désactivation d'un modèle indisponible, l'appel de mise à jour
- [x] `docs/checklist-implementation.md` mis à jour
