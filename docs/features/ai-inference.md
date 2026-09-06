# Feature — `ai-inference`

**Statut : ⬜ À faire.** Phase 5 — IA avancée.

## Objet

Seul module d'`apps/api` autorisé à appeler `apps/ai-service` par HTTP interne (voir
`.cursor/rules/008-ai-service-integration.mdc`). Couvre trois usages : (1) le remplacement du
placeholder actuel (`modelVersion: "placeholder-0.0.0"`, `confidence: 0`) par un véritable
appel au modèle entraîné pour suggérer des `PatternParameters`, (2) l'analyse d'une photo
d'inspiration (spec §21), (3) le backend de l'assistant IA global du site (spec §31), qui
persiste dans `AIConversation`. Dans tous les cas, `ai-inference` **ne produit jamais de
géométrie de patron** — voir ADR-005 (`docs/architecture.md`) et
`docs/features/pattern-engine.md`.

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
    analyze-inspiration-photo.use-case.ts    → reçoit une inspirationImageUrl déjà hébergée sur MinIO,
                                                retourne detectedInspirationFeatures
    send-assistant-message.use-case.ts       → persiste le message USER, appelle ai-service, persiste la
                                                réponse ASSISTANT
    get-conversation-history.use-case.ts
  dtos/
    ai-suggestion-request.dto.ts, assistant-message.dto.ts   → class-validator
infrastructure/
  repositories/prisma-ai-conversation.repository.ts
  services/ai-service-http-client.ts         → client HTTP (AI_SERVICE_URL, timeout AI_SERVICE_TIMEOUT_MS),
                                                miroir strict de app/schemas.py (apps/ai-service) — voir
                                                Points d'intégration
  mappers/
presentation/
  controllers/
    ai-inspiration.controller.ts             → endpoint appelé directement par le frontend (wizard étape 6)
    ai-assistant.controller.ts               → endpoints de l'assistant global (messages + historique)
  guards/
__tests__/
  unit/suggest-pattern-parameters.use-case.spec.ts → cas succès, timeout, erreur HTTP (mock du client)
  unit/analyze-inspiration-photo.use-case.spec.ts
  unit/send-assistant-message.use-case.spec.ts
  integration/ai-inspiration.controller.spec.ts
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
| `POST` | `/api/ai-inference/inspiration-analysis` | `analyze-inspiration-photo` | `CLIENT` |
| `POST` | `/api/ai-inference/assistant/messages` | `send-assistant-message` | `CLIENT` |
| `GET` | `/api/ai-inference/assistant/conversations` | `get-conversation-history` | `CLIENT` |

`suggest-pattern-parameters` n'a **pas** d'endpoint HTTP propre : il n'est consommé qu'en
interne (injection Nest) par le use-case `generate-pattern-version` du module `patterns` — voir
Points d'intégration.

## Points d'intégration

- **`apps/ai-service`** : unique appelant HTTP autorisé (`AI_SERVICE_URL`), via
  `ai-service-http-client.ts`. Le contrat `PatternAiSuggestionRequest`/`PatternAiSuggestionResponse`
  (`packages/types/src/index.ts`) est le miroir exact de `apps/ai-service/app/schemas.py`
  (mêmes noms de champs) — **modifier les deux ensemble**.
- **`patterns`** : `generate-pattern-version` injecte directement le provider exporté par ce
  module (appel Nest en process, pas un second saut HTTP) pour obtenir une suggestion en
  best-effort — `patterns/infrastructure/services/ai-inference-client.service.ts`
  (`docs/features/patterns.md`) est ce point d'injection, jamais un client HTTP dupliqué vers
  `apps/ai-service`.
- **`pattern-studio-wizard`** (frontend) : appelle directement
  `POST /api/ai-inference/inspiration-analysis` à l'étape 6 (voir
  `docs/pages/pattern-studio-wizard.md`) — ce n'est pas une violation de la frontière
  `apps/web → ai-service`, car l'appel passe bien par un contrôleur du module `ai-inference`.
- **Assistant IA global** (spec §31) : consommé par un widget transverse côté frontend (hors
  périmètre des 4 pages Pattern Studio de cette session), qui appelle
  `ai-assistant.controller.ts` directement.

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

- [ ] `suggest-pattern-parameters` testé pour les cas succès / timeout / erreur HTTP, avec vérification que l'appelant ne reçoit jamais d'exception bloquante
- [ ] `analyze-inspiration-photo` testé (réponse placeholder actuelle explicitement marquée non définitive)
- [ ] `send-assistant-message` testé : persiste bien un message `USER` puis un message `ASSISTANT`
- [ ] `docs/checklist-implementation.md` : `ai-inference` passé à ✅
