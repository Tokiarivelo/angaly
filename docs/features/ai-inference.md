# Feature — `ai-inference`

**Statut : ✅ Fait.** Phase 4/5. Pipeline réellement branché depuis la session 2026-09-14 ;
un second backend réel entraîné localement pour l'estimation de mesures a été ajouté en
session 2026-09-15 (voir ci-dessous et `docs/features/ai-model-settings.md`). La suggestion
de coupe/détails reste un wrapper Gemini prompt-engineered, décision documentée (aucune
donnée publique disponible pour entraîner ce cas précis), pas un manque.

Session du 2026-09-14 : le pipeline était présent en code mais déconnecté du flux réel
(`AiInspirationController` renvoyait un stub statique, `sendMessageToAssistant` un texte codé
en dur, et `SuggestPatternParametersUseCase` n'avait aucun point d'entrée HTTP ni d'appelant).
Tout est désormais réellement branché sur `apps/ai-service` (Gemini `gemini-2.5-flash` via
`google-genai`) — voir Points d'intégration.

Session du 2026-09-15 : ajout d'un **second backend réel**, entraîné localement, pour
l'estimation de mesures manquantes — voir `docs/features/ai-model-settings.md`. Un
administrateur choisit lequel des deux (`GEMINI` ou `LOCAL_STATISTICAL`) est utilisé par
défaut via `/admin/ai-settings`. Pour la suggestion de coupe/détails
(`suggest-pattern-parameters`), il ne reste **pas** de "vrai modèle entraîné" — aucune
donnée publique n'existe pour ce problème précis (voir `docs/features/ai-model-settings.md`,
« Pourquoi pas un modèle pour la coupe ? ») ; c'est toujours un wrapper prompt-engineered
autour de l'API Gemini managée, grounded avec la table de tailles standard
(`packages/types/src/size-charts.ts`).

## Objet

Seul module d'`apps/api` autorisé à appeler `apps/ai-service` par HTTP interne (voir
`.cursor/rules/008-ai-service-integration.mdc`). Couvre quatre usages : (1) suggérer des
`PatternParameters` (coupe/détails) à partir des mesures/style saisis, (2) l'analyse d'une photo
d'inspiration (spec §21), (3) l'estimation de mesures manquantes par LLM (grounded sur la table
de tailles standard) quand la génération de patron ne dispose pas de toutes les clés requises,
(4) le backend de l'assistant IA global du site (spec §31), qui persiste dans `AIConversation`.
Dans tous les cas, `ai-inference` **ne produit jamais de géométrie de patron** — voir ADR-005
(`docs/architecture.md`) et `docs/features/pattern-engine.md`.

## Emplacement Clean Architecture

`apps/api/src/ai-inference/`

```
domain/
  entities/ai-conversation-message.entity.ts → invariants (role USER/ASSISTANT, message non vide)
  repositories/ai-conversation.repository.ts → IAIConversationRepository (zéro import Prisma)
  value-objects/confidence-score.vo.ts       → borne [0,1], expose isIndicativeOnly() (true si proche de 0
                                                ou modelVersion placeholder)
application/
  use-cases/
    suggest-pattern-parameters.use-case.ts   → construit un PatternAiSuggestionRequest, appelle le port HTTP,
                                                dégrade proprement en cas d'échec/timeout (ne lève jamais
                                                d'exception bloquante pour l'appelant)
    estimate-missing-measurements.use-case.ts → appelé par `patterns/generate-pattern-version` quand des clés
                                                requises manquent ; toujours indicatif (ConfidenceScore)
    send-assistant-message.use-case.ts       → persiste le message USER, appelle ai-service, persiste la
                                                réponse ASSISTANT
    get-conversation-history.use-case.ts
  dtos/
    ai-suggestion-request.dto.ts, assistant-message.dto.ts   → class-validator
infrastructure/
  repositories/prisma-ai-conversation.repository.ts
  services/ai-service-http-client.ts         → client HTTP (AI_SERVICE_URL, timeout AI_SERVICE_TIMEOUT_MS),
                                                miroir strict de app/schemas.py (apps/ai-service) — voir
                                                Points d'intégration. Couvre suggestPatternParameters,
                                                sendMessageToAssistant et estimateMissingMeasurements.
presentation/
  controllers/
    ai-inspiration.controller.ts             → appelle réellement SuggestPatternParametersUseCase
                                                (avec inspirationImageUrl) — plus un stub statique
    ai-pattern-suggestions.controller.ts     → POST /ai-inference/pattern-suggestions, seul point d'entrée
                                                HTTP de SuggestPatternParametersUseCase pour le wizard
                                                (Cut/Details steps) — suggestion jamais appliquée sans
                                                confirmation utilisateur (règle absolue #18)
    ai-assistant.controller.ts               → endpoints de l'assistant global (messages + historique)
  guards/
__tests__/
  unit/suggest-pattern-parameters.use-case.spec.ts → cas succès, timeout, erreur HTTP (mock du client)
  unit/estimate-missing-measurements.use-case.spec.ts
  unit/send-assistant-message.use-case.spec.ts
  unit/ai-service-http-client.spec.ts        → fetch réel mocké, vérifie les 3 méthodes + dégradation
  integration/ai-inspiration.controller.spec.ts
  integration/ai-pattern-suggestions.controller.spec.ts
```

## Modèles Prisma

Aucun nouveau modèle. Lit/écrit `AIConversation` (relations `Customer?`, `PatternProject?` —
l'assistant peut être global ou rattaché à un projet). Les suggestions renvoyées ne sont
jamais persistées comme `PatternParameters` définitifs — c'est `patterns` qui décide de les
appliquer après confirmation utilisateur/couturière.

## Cas d'usage clés

- Suggérer des `PatternParameters` à partir des mesures/paramètres saisis (best-effort,
  jamais bloquant) — `suggest-pattern-parameters`
- Analyser une photo d'inspiration déjà hébergée sur MinIO et retourner des
  `detectedInspirationFeatures` indicatifs — `analyze-inspiration-photo`
- Envoyer un message à l'assistant IA global et persister l'échange — `send-assistant-message`
- Consulter l'historique d'une conversation — `get-conversation-history`

## Endpoints exposés

| Méthode | Route | Use-case | Auth |
| --- | --- | --- | --- |
| `POST` | `/api/ai-inference/inspiration-analysis` | `suggest-pattern-parameters` (avec `inspirationImageUrl`) | `CLIENT` |
| `POST` | `/api/ai-inference/pattern-suggestions` | `suggest-pattern-parameters` | `CLIENT` |
| `POST` | `/api/ai-inference/assistant/messages` | `send-assistant-message` | `CLIENT` |
| `GET` | `/api/ai-inference/assistant/conversations` | `get-conversation-history` | `CLIENT` |

`estimate-missing-measurements` n'a **pas** d'endpoint HTTP propre : il n'est consommé qu'en
interne (injection Nest, `AiInferenceModule` exporté et importé par `PatternsModule`) par
`generate-pattern-version` du module `patterns` — voir Points d'intégration.

## Points d'intégration

- **`apps/ai-service`** : unique appelant HTTP autorisé (`AI_SERVICE_URL`), via
  `ai-service-http-client.ts`. Trois routes consommées : `POST /v1/pattern/suggest-parameters`,
  `POST /v1/pattern/estimate-measurements`, `POST /v1/chat/assistant`. Les contrats
  (`PatternAiSuggestionRequest/Response`, `PatternMeasurementEstimationRequest/Response`,
  `packages/types/src/index.ts` + `size-charts.ts`) sont le miroir exact de
  `apps/ai-service/app/schemas.py` (mêmes noms de champs) — **modifier les deux ensemble**.
- **`patterns`** : `PatternsModule` importe `AiInferenceModule` et
  `generate-pattern-version.use-case.ts` injecte directement `EstimateMissingMeasurementsUseCase`
  et `GetMeasurementProfileUseCase` (`measurements`) — appel Nest en process, pas un second saut
  HTTP. Ordre de résolution des mesures : profil lié → mesures manuelles du wizard → estimation
  IA pour les clés encore manquantes (jamais de valeur par défaut codée en dur — voir
  `docs/features/pattern-engine.md`).
- **`admin-ai-settings`** : `AiInferenceModule` importe `AdminAiSettingsModule` ;
  `EstimateMissingMeasurementsUseCase` lit `GetAiModelSettingUseCase.execute()` pour
  déterminer le backend par défaut (`GEMINI`/`LOCAL_STATISTICAL`) à chaque estimation, sauf
  si le DTO fournit déjà un `modelPreference` explicite. Voir `docs/features/ai-model-settings.md`.
- **`pattern-studio-wizard`** (frontend) : appelle `POST /api/ai-inference/inspiration-analysis`
  à l'étape 6 et peut appeler `POST /api/ai-inference/pattern-suggestions` depuis l'étape Coupe
  (bouton « Obtenir une suggestion IA » dans `CutStep.tsx`, voir
  `docs/pages/pattern-studio-wizard.md`) — ce n'est pas une violation de la frontière
  `apps/web → ai-service`, car l'appel passe bien par un contrôleur du module `ai-inference`.
- **Assistant IA global** (spec §31) : consommé par un widget transverse côté frontend (hors
  périmètre des 4 pages Pattern Studio de cette session), qui appelle
  `ai-assistant.controller.ts` directement. `sendMessageToAssistant` appelle désormais réellement
  `POST /v1/chat/assistant` côté `apps/ai-service` (ce n'était qu'un texte codé en dur
  auparavant).

## Points d'attention

- **Une suggestion n'est jamais la source de vérité** (ADR-005) : `confidence` proche de 0 ou
  `modelVersion: "placeholder-0.0.0"` doit être signalé explicitement comme indicatif par le
  DTO renvoyé (`ConfidenceScore.isIndicativeOnly()`), à charge du frontend de ne jamais
  l'afficher comme un résultat définitif.
- **Dégradation obligatoire** : `suggest-pattern-parameters` doit respecter
  `AI_SERVICE_TIMEOUT_MS` et retourner un résultat vide/dégradé plutôt que de lever une
  exception — une panne ou une lenteur d'`apps/ai-service` ne doit **jamais** bloquer
  `generate-pattern-version` côté `patterns` (voir `.cursor/rules/008-ai-service-integration.mdc`
  et `docs/features/patterns.md`).
- `analyze-inspiration-photo` ne prétend jamais reproduire la photo à l'identique (spec §21) —
  seulement des `detectedInspirationFeatures` sous forme de suggestions de paramètres.
- `ai-inference` ne parle jamais directement à MinIO : il reçoit une `inspirationImageUrl` déjà
  publique (déjà uploadée via le module `media`) et ne persiste aucun fichier lui-même.

## Vérification

- [x] `suggest-pattern-parameters` testé pour les cas succès / timeout / erreur HTTP, avec vérification que l'appelant ne reçoit jamais d'exception bloquante
- [x] `ai-inspiration.controller` testé : appelle réellement `SuggestPatternParametersUseCase`, plus un stub statique
- [x] `estimate-missing-measurements` testé : cas succès, dégradation (fallback size-chart côté `apps/ai-service`), filtrage des clés non demandées
- [x] `send-assistant-message` testé : persiste bien un message `USER` puis un message `ASSISTANT`
- [x] `ai-service-http-client` testé directement (les 3 méthodes HTTP + dégradation gracieuse)
- [ ] Vrai modèle entraîné (fine-tuning/dataset labellisé) — hors de portée sans infrastructure ML dédiée ; l'existant est un wrapper prompt-engineered sur Gemini, grounded par la table de tailles standard
- [x] `docs/checklist-implementation.md` : `ai-inference` reflète l'état réel (🟡, branché mais sans modèle entraîné)
