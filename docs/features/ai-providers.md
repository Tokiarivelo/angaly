# Spécification & Implémentation — Fournisseurs d'IA multiples (`/admin/ai-settings`)

**Statut : ✅ Implémenté et testé de bout en bout (2026-10-02). Maquettes Stitch générées et intégrées (`996ac3c2…` & `acd304bc…`).** Étend `docs/features/ai-model-settings.md`
(choix `GEMINI` / `LOCAL_STATISTICAL`) pour que l'ADMIN connecte plusieurs fournisseurs LLM
(Claude, Gemini, OpenAI, Meta Muse Spark, et d'autres gratuits ou payants) et choisisse lequel sert
chaque usage. Maquette : `stitch-prompts/33-admin-ai-settings-fournisseurs.md` → écran Stitch réel
`projects/3703874896720765754/screens/996ac3c27a3b4a099126604d383203ad` (« ANGALY Back-office — Paramètres IA
Pattern Studio », 2560×2048) et tiroir `acd304bc8fcf48fb900733db616f49c4`. Page : `docs/pages/admin-ai-settings.md`.

## 1. Périmètre et garde-fous

- **Usages pilotables** : (a) estimation des mesures manquantes, (b) suggestion de coupe/détails
  (`suggest-pattern-parameters`, aujourd'hui Gemini en dur). Ce sont des tâches texte/JSON structuré.
- **Hors périmètre** : la géométrie. `packages/pattern-engine` reste la seule source (ADR-005, règles
  18–19). Aucun fournisseur ne produit de géométrie via ce module.
- `LOCAL_STATISTICAL` reste un « fournisseur » spécial : sans clé, auto-hébergé, repli final.
- Règle 20 : seul le module NestJS `ai-inference` appelle `apps/ai-service`. Le web ne parle jamais aux
  fournisseurs ni à l'ai-service.
- Les clés API sont des secrets : **chiffrées au repos, jamais renvoyées au client**, jamais loguées.

## 1 bis. Écran(s) Stitch à intégrer

**Deux écrans** ont été générés et vérifiés via StitchMCP :

| # | Écran Stitch | Id | Route | Statut |
| --- | --- | --- | --- | --- |
| 1 | ANGALY Back-office — Paramètres IA Pattern Studio | `996ac3c27a3b4a099126604d383203ad` | `/admin/ai-settings` | ✅ généré |
| 2 | Tiroir « Connecter Claude (Anthropic) » (clé API, modèle, usages, test) | `acd304bc8fcf48fb900733db616f49c4` | même route, état UI | ✅ généré (`edit_screens`) |
| 3 | États : liste vide (seul le modèle local), erreurs de test, chargement | — | même route | ⏳ inclus dans les composants UI |

Sections de l'écran 1 → composants (copy relevée sur l'écran réel) :

| Zone Stitch | Contenu relevé | Composant | Donnée / endpoint |
| --- | --- | --- | --- |
| Sidebar | Nouveau Modèle, Dashboard, Creations, Products, Collections, Appointments, Clients, Pattern Studio, **Paramètres IA** (actif), Pages, Médiathèque, Paramètres, Support Dédié, carte « Marie D. / Admin Atelier » | `AdminSidebar` existant | **Écart** : la maquette propose plus d'entrées que l'`AdminSidebar` actuel ; ne rendre que les routes existantes, ne pas créer d'entrées mortes |
| Top bar | Recherche, « Voir la boutique », cloche, aide, « Admin Role / Atelier Principal » | `AdminLayout` existant | session |
| En-tête | Fil d'Ariane, titre, sous-titre, bouton « Ajouter un fournisseur » | `AiSettingsPage` | ouvre le tiroir en mode catalogue |
| Modèle actif par usage | badge « Configuration directe » ; 2 selects (Estimation des mesures manquantes / Suggestion de coupe et détails) avec options Claude, Gemini, Modèle statistique local (ANSUR II) ; « Repli automatique : Modèle statistique local si l'API est indisponible. » ; « Tolérance latence : 3500ms » | `ActiveModelSection` | `GET/PATCH /admin/ai-settings` (routage §5) ; la tolérance = timeout fournisseur avant repli (constante config, lecture seule dans l'UI v1) |
| Fournisseurs connectés (compteur « 4 », « Synchronisation en continu ») | 4 cartes : monogramme (AN, GO, OA, LC), nom, pills Connecté / Clé invalide / Actif, modèle, clé masquée, offre (Payant / Gratuit avec quota / Auto-hébergé), « Tester la connexion », « Modifier » ; carte OpenAI : message d'erreur + « Modèle ciblé : gpt-4o » ; carte locale : « Disponible », « Base biométrique anthropométrique intégrée • Moteur local sécurisé • Aucune clé API requise », « Configurer » | `ConnectedProviderCard` | `GET /admin/ai-settings/providers`, `POST …/:provider/test` ; « Synchronisation en continu » = `refetchInterval` react-query (ex. 30 s), pas de websocket |
| Catalogue | filtres Tous / Gratuit / Payant / Auto-hébergé ; 11 cartes : Claude, Gemini, OpenAI, Meta Muse Spark, Mistral, Groq, OpenRouter, DeepSeek, Together AI, Cerebras (bouton « Connecter »), Ollama / compatible OpenAI (bouton « Configurer l'hôte local ») | `ProviderCatalogGrid` | catalogue statique §2 (mêmes libellés d'offre que la maquette) |
| Carte latérale « Modèle actif » | « Claude / claude-sonnet-5-5 », badge « En service », « Affectation principale », « Dernière modification : … par Admin », Latence moyenne 1,2 s « Optimale », Requêtes ce mois 148 « Quota illimité », « Règle déontologique : … soumise à confirmation lors du premier essayage de la cliente. », bouton « Rapports de précision biométrique » | `ActiveModelSummary` | config + `ai_usage_logs` (§10) |
| Bandeau « Garantie Moteur ANGALY » | « L'IA n'élabore jamais vos lignes de coupe. … » + badges « Chiffrement AES-256 », « Couture Certifiée » | `EngineGuaranteeBanner` | statique |

Décisions arrêtées sur les points de copy de la maquette :

- **« Quota illimité »** : Retiré. Remplacé par le libellé d'offre contractuel du fournisseur (ex. « Offre Payante », « Gratuit avec quota »).
- **« 148 requêtes » et « Latence 1,2 s »** : Aucun chiffre inventé. La latence affichée est la **latence réelle mesurée** lors du dernier test de connexion (`lastLatencyMs`). Le compteur de requêtes ce mois est omis tant que la table `ai_usage_logs` n'est pas implémentée.
- **« Rapports de précision biométrique »** : Retiré en v1 pour respecter le principe « aucune action ou bouton mort » (aucun endpoint sous-jacent).
- **« serveurs sécurisés d'ANGALY à Antananarivo »** : Reformulé de manière techniquement exacte sans dépendre de l'hébergement physique du serveur : « demeurent strictement exécutées sur les serveurs sécurisés d'ANGALY. Aucun tracé vestimentaire n'est téléversé chez les fournisseurs externes. »
- **« Couture Certifiée »** : Remplacé par le badge « Patronage Déterministe », reflétant la garantie architecturale éprouvée d'ANGALY Pattern Engine (ADR-005).
- **Écart de copy avec le prompt** : l'écran ajoute « Configuration directe », « Synchronisation en continu », « Garantie Moteur ANGALY » ; la copy de l'écran réel prime (règle CLAUDE.md étape 1).

## 2. Catalogue de fournisseurs (recherche web, 2026-10)

Un fournisseur = une entrée de catalogue **statique** (code, pas base) + une configuration admin en base.

| Id | Fournisseur | Adaptateur | Offre | Notes |
| --- | --- | --- | --- | --- |
| `ANTHROPIC` | Claude | SDK `anthropic` natif | Payant | Modèles par défaut proposés : `claude-sonnet-5-5`, `claude-haiku-4-5-20251001`, `claude-opus-5-5` |
| `GEMINI` | Google Gemini | SDK `google-genai` (existant) | Gratuit avec quota + payant | Défaut `gemini-2.5-flash` |
| `OPENAI` | OpenAI | OpenAI-compatible | Payant | |
| `META_MUSE` | Meta Muse Spark (Meta Model API) | OpenAI-compatible (à confirmer dans la doc Meta) | Aperçu public, 20 $ de crédits offerts, 1,25/4,25 $ par M tokens ; US d'abord, liste d'attente ailleurs | Muse Spark 1.1 (juil. 2026), 1.3 (sept. 2026). Disponibilité géographique à vérifier → afficher « Non testé » plutôt que supposer |
| `MISTRAL` | Mistral | OpenAI-compatible | Gratuit (quota, opt-in entraînement) + payant | Vérifier l'opt-in données : sensible (mesures clientes) |
| `GROQ` | Groq | OpenAI-compatible | Gratuit avec quota | Llama / modèles ouverts, très rapide |
| `OPENROUTER` | OpenRouter | OpenAI-compatible | ~20+ modèles gratuits, quotas faibles | Passerelle vers de nombreux modèles |
| `DEEPSEEK` | DeepSeek | OpenAI-compatible | Payant (crédits d'essai) | |
| `TOGETHER` | Together AI | OpenAI-compatible | Crédits d'essai | |
| `CEREBRAS` | Cerebras | OpenAI-compatible | Gratuit avec quota | |
| `CUSTOM_OPENAI` | Ollama / vLLM / tout endpoint compatible | OpenAI-compatible, `baseUrl` libre | Auto-hébergé | Voir SSRF §6 |
| `LOCAL_STATISTICAL` | Modèle ANSUR II | interne | Auto-hébergé | Existant, sans clé |

**Principe clé** : 2 adaptateurs natifs (Anthropic, Gemini) + **1 adaptateur OpenAI-compatible
générique** paramétré par `baseUrl` couvrent tous les autres. Ajouter un fournisseur compatible = une
ligne de catalogue, zéro code d'adaptateur. Les prix/quotas ci-dessus évoluent : les afficher comme
des libellés indicatifs (« Gratuit », « Payant ») sans valeurs chiffrées dans l'UI.

Sources : Meta Model API (<https://ai.meta.com/blog/introducing-muse-spark-meta-model-api/>,
<https://www.datacamp.com/blog/muse-spark-1-1>), comparatif des offres gratuites
(<https://openrouter.ai/blog/tutorials/free-llm-apis-compared/>).

## 3. Modèle de données (`packages/database`)

Remplace l'enum `AiMeasurementModel` (2 valeurs) par une configuration par fournisseur.

```prisma
enum AiProviderId { ANTHROPIC GEMINI OPENAI META_MUSE MISTRAL GROQ OPENROUTER DEEPSEEK TOGETHER CEREBRAS CUSTOM_OPENAI LOCAL_STATISTICAL }
enum AiUsage { MEASUREMENT_ESTIMATION PATTERN_SUGGESTION }

model AiProviderConfig {
  id            String       @id @default(cuid())
  provider      AiProviderId @unique          // une config par fournisseur
  model         String                         // identifiant du modèle
  baseUrl       String?                        // CUSTOM_OPENAI (et override optionnel)
  apiKeyCipher  String?                        // AES-256-GCM : iv.tag.ciphertext (base64)
  apiKeyLast4   String?                        // pour l'affichage masqué
  status        AiProviderStatus @default(UNTESTED)  // UNTESTED | OK | INVALID
  lastTestedAt  DateTime?
  lastLatencyMs Int?
  enabled       Boolean      @default(true)
  updatedById   String?
  updatedAt     DateTime     @updatedAt
  createdAt     DateTime     @default(now())
  updatedBy     User?        @relation(fields: [updatedById], references: [id])
  @@map("ai_provider_configs")
}

// Existant AiModelSetting (singleton) : on ajoute le routage par usage
// measurementProvider AiProviderId @default(GEMINI)   // remplace measurementModel
// patternSuggestionProvider AiProviderId @default(GEMINI)
```

Migration : `measurementModel` → `measurementProvider` (mapping 1:1 `GEMINI`/`LOCAL_STATISTICAL`, sans
perte), `patternSuggestionProvider` par défaut `GEMINI` (comportement actuel inchangé). Nouvelle env :
`AI_KEYS_ENCRYPTION_KEY` (32 octets base64) ajoutée à `.env.example` et `docs/deployment.md`.

## 4. Types partagés (`@angaly/types`)

`AiProviderId`, `AiUsage`, `AiProviderStatus`, `AiProviderCatalogEntry` (id, nom, offre
`FREE|FREEMIUM|PAID|SELF_HOSTED`, `requiresApiKey`, `requiresBaseUrl`, `suggestedModels[]`),
`AiProviderConfigView` (**sans** clé : `apiKeyLast4`, `status`, `model`, …), `UpsertAiProviderDto`,
`AiRoutingSetting`. Le contrat ai-service gagne `ProviderCredentials {provider, model, apiKey?, baseUrl?}`.

## 5. Backend (`apps/api`, Clean Architecture)

Module `admin-ai-settings` étendu (pas de nouveau module ; `ai-inference` dépend toujours de lui à sens
unique) :

- **Domain** : entité `AiProviderConfig` ; port `IAiProviderConfigRepository` ; port
  `ISecretCipher` (chiffrer/déchiffrer) — le Domain n'importe ni Prisma ni Nest ni `crypto`.
  Catalogue statique `ai-provider-catalog.ts` (données pures).
- **Application** (use-cases + DTO class-validator) : `list-ai-providers` (catalogue + configs
  masquées), `upsert-ai-provider` (valide la clé requise selon le catalogue), `remove-ai-provider`,
  `test-ai-provider` (délègue à `ai-inference`), `get/update-ai-routing` (étend l'existant).
  Règle : on ne peut pas router un usage vers un fournisseur non configuré/`enabled`, ni supprimer le
  fournisseur actif d'un usage.
- **Infrastructure** : `PrismaAiProviderConfigRepository`, `AesGcmSecretCipher` (Node `crypto`,
  `AI_KEYS_ENCRYPTION_KEY`).
- **Presentation** (`@Roles(Role.ADMIN)` au niveau controller, jamais dans les use-cases) :

| Méthode | Route | Rôle |
| --- | --- | --- |
| `GET` | `/api/admin/ai-settings/providers` | catalogue + configs (clés masquées) |
| `PUT` | `/api/admin/ai-settings/providers/:provider` | créer/modifier (clé optionnelle à la modif : absente = inchangée) |
| `DELETE` | `/api/admin/ai-settings/providers/:provider` | retirer |
| `POST` | `/api/admin/ai-settings/providers/:provider/test` | test de connexion → met à jour `status`/latence |
| `GET`/`PATCH` | `/api/admin/ai-settings` | routage par usage (existant, étendu) |

- **`ai-inference`** : au moment de l'appel, résout le fournisseur de l'usage, déchiffre la clé et
  l'envoie à `apps/ai-service` dans le corps de requête (réseau interne uniquement, voir §6). Repli en
  chaîne : fournisseur choisi → `LOCAL_STATISTICAL` (mesures) / Gemini si configuré (suggestion) →
  erreur gérée (jamais de crash du wizard). `GET /ai-inference/available-models` est remplacé par le
  statut des configs.

## 6. `apps/ai-service` (FastAPI)

- Interface `LlmProvider.generate_json(prompt, schema) -> dict` ; implémentations
  `AnthropicProvider`, `GeminiProvider` (extraction de `inference.py`), `OpenAICompatibleProvider`
  (`openai` SDK avec `base_url`).
- Les prompts et la validation des schémas de sortie restent **communs** (`schemas.py`) : sortie du
  fournisseur validée par Pydantic ; clé de coupe inconnue → `DROITE` (comportement actuel).
- `schemas.py` : `model_preference: str` devient `provider: ProviderCredentials`. Endpoint
  `POST /v1/providers/test` (ping minimal, retourne latence).
- Clés : reçues par requête, **jamais persistées ni loguées** (filtre de log sur `apiKey`).
- **SSRF** : pour `CUSTOM_OPENAI`, refuser `baseUrl` non-`https` (sauf `localhost` en dev),
  IP privées/metadata (`169.254.0.0/16`, etc.) hors liste blanche `AI_ALLOWED_PRIVATE_HOSTS`.
  Validation côté API **et** ai-service.
- Dépendances : `anthropic`, `openai` ajoutées à `requirements`.

## 7. Frontend (`apps/web/src/features/admin-ai-settings/`)

Maquette Stitch réelle vérifiée (écran 1, §1 bis) ; re-vérifier via MCP avant chaque composant :

```
api/ai-providers.api.ts            → endpoints §5
hooks/useAiProviders.ts, useUpsertAiProvider.ts, useRemoveAiProvider.ts,
      useTestAiProvider.ts, useAiRouting.ts   (react-query, invalidations)
consts/providerCatalog.ts          → monogrammes/couleurs (pas de logos de marque)
ui/AiSettingsPage.tsx              → remplace AiModelSettingsPage (composition)
ui/ActiveModelSection.tsx, ConnectedProviderCard.tsx, ProviderCatalogGrid.tsx,
   ConnectProviderDrawer.tsx (formulaire Zod : clé, modèle, baseUrl, usages), ActiveModelSummary.tsx,
   EngineGuaranteeBanner.tsx
```

Composants purement présentationnels ; logique dans les hooks ; Zod pour le formulaire ; champ clé en
`type="password"` jamais prérempli (placeholder `••••3f9a`) ; la clé quitte le state du formulaire dès
le submit.

## 8. Tests (même commit que le code)

- API unit : chaque use-case ; `AesGcmSecretCipher` (aller-retour, tag altéré rejeté, clé absente →
  erreur explicite) ; règles de routage ; clé jamais présente dans les vues.
- API integration (Supertest) : 403 non-ADMIN sur tous les endpoints ; `PUT` sans clé conserve l'ancienne ;
  réponse sans `apiKeyCipher`.
- ai-service (pytest) : chaque provider avec client mocké ; sortie invalide → repli ; `baseUrl`
  privée refusée ; clé absente des logs.
- Web (Vitest) : drawer (validation Zod, test de connexion), carte (états OK/INVALID/UNTESTED), grille
  catalogue + filtres, routage.
- E2E Playwright : ADMIN connecte un fournisseur (API mockée), change le modèle actif ; COUTURIERE
  redirigée.

## 9. Phasage (une phase par session)

1. **Maquette** : ✅ Écran 1 généré (`996ac3c27a3b4a099126604d383203ad`), écran 2 tiroir généré (`acd304bc8fcf48fb900733db616f49c4`), décisions copy §1 bis arrêtées, documentation synchronisée.
2. **Données + types** : ✅ Migration Prisma `20261002134653_add_ai_provider_configs`, client généré, `@angaly/types` (`AiProviderId`, `AiProviderStatus`, `AiProviderCatalogEntry`, `AiProviderConfigView`, `UpsertAiProviderDto`, `AiRoutingSetting`, etc.), `.env.example`.
3. **API** : ✅ Domain / Application / Infrastructure / Presentation + tests (42 tests unitaires & intégration réussis). Endpoints `GET`, `PUT`, `DELETE`, `POST /:provider/test` sur `/admin/ai-settings/providers`, `GET`, `PATCH` sur `/admin/ai-settings`, service de chiffrement `AesGcmSecretCipher` (AES-256-GCM), validation SSRF.
4. **ai-service** : ✅ Abstraction `LlmProvider`, adaptateurs Anthropic, Gemini, OpenAI-compatible (OpenAI, Mistral, Groq, OpenRouter, DeepSeek, Together, Cerebras, Meta Muse, Ollama/Custom), validation SSRF (blocage des IPs cloud metadata et privées), test de connexion `POST /v1/providers/test` + 42 tests pytest réussis (95% couverture).
5. **`ai-inference`** : ✅ Routage dynamique par usage, service `AiProviderResolverService` déchiffrant les clés avec `AesGcmSecretCipher`, chaîne de repli automatique vers `LOCAL_STATISTICAL` (ANSUR II) ou Gemini en dur + 26 tests unitaires et intégration Jest réussis.
6. **Frontend** : ✅ Page `/admin/ai-settings`, tiroir slide-over de connexion, catalogue filtrable, récapitulatif modèle actif, bandeau garantie moteur, hooks react-query, `put` ajouté à `apiClient`, 17 tests Vitest réussis et 0 erreur de typecheck.
7. **Docs** : ✅ `docs/pages/admin-ai-settings.md`, `docs/checklist-implementation.md`, `docs/mockup-reference.md`, `docs/environment-variables.md`, `docs/handoff.md` mis à jour.

## 10. Risques et décisions ouvertes

- **Confidentialité** : les mesures corporelles de clientes partent chez un tiers. Anonymiser (aucun
  nom/email dans les prompts — déjà le cas : seulement mesures et gabarit), documenter par fournisseur
  si les données servent à l'entraînement (offres gratuites : souvent oui, ex. Mistral gratuit).
  Proposition : badge d'avertissement « données possiblement utilisées pour l'entraînement » sur les
  offres gratuites. **À valider par le produit.**
- **Meta Muse Spark** : API en aperçu, accès US d'abord ; confirmer la compatibilité OpenAI et les
  identifiants de modèle sur la doc officielle avant la phase 4.
- **Rotation de la clé de chiffrement** : prévoir un champ `keyVersion` dès le départ (non inclus
  ci-dessus par simplicité) si la rotation est requise.
- **Coût** : pas de plafond de dépense pour l'instant ; envisager compteur mensuel + limite (la carte
  « Requêtes ce mois » de la maquette suppose un compteur → petite table `ai_usage_logs`, à décider).
