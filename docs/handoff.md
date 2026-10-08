# Fiche de Passation Inter-Agents (Handoff)

> **Date** : 2026-10-02  
> **Dernière mise à jour par** : Antigravity  
> **Statut global du dépôt** : 🟢 **Vert** (typecheck monorepo 10/10 OK, tests pytest ai-service 42/42 OK [95% coverage], tests jest api 68/68 OK, tests vitest web 850/850 OK)

---

## 🚀 Consigne pour le nouvel agent (Prompt de démarrage)

Copier-coller ce prompt pour démarrer une nouvelle session ou un nouvel agent :

```text
Lis docs/handoff.md et poursuis le travail selon les priorités définies.
```

---

## 0 bis. Session 2026-10-08 (suite) — Phase 5b S2 livrée

Moteur `0.2.0-fit` : `ease`, `lengths`, `fullness` et 5 mesures (`LONGUEUR_JUPE`, `HAUTEUR_TAILLE_SOL`,
`LONGUEUR_DEVANT`, `HAUTEUR_BASSIN`, `HAUTEUR_FOURCHE`) modifient réellement les contours ; `CONFORT`/défauts
= géométrie historique (95 tests existants inchangés). `warnings[]` géométriques ajoutés. Tests : moteur 131,
API 1239, web verts, typecheck 10/10. Détail : `docs/features/pattern-engine.md`.

⚠️ Après `git pull` : appliquer la migration `20261008130000` (`pnpm --filter @angaly/database db:migrate`),
sinon toute lecture de projet échoue (colonne `parametersExtJson`).

**S2b (même session)** : les mesures restantes du catalogue sont désormais lues par le moteur — épaules/carrures,
profondeur d'emmanchure, **pince de poitrine**, manches (bras/poignet/emmanchure), col (tour de cou), jambes
(cuisse/genou/cheville/entrejambe/hauteur genou). Le catalogue passe à 28 mesures (`TOUR_HAUT_BASSIN`,
`HAUTEUR_TOTALE`, `HAUTEUR_COUDE` retirées : aucune règle ne les lit) et un test échoue si une mesure du
catalogue n'est lue par aucune règle. L'avertissement « Autre » vient du moteur (`IPatternRule.warnings?`).
`@vitest/coverage-v8` installé dans pattern-engine : couverture 89,6 % (moteur : 159 tests).

**S3 livrée** (voir `docs/features/ai-inference.md`) : `GarmentProfile.fit` extrait par l'IA (ai-service
`normalize_fit`, bornes miroir testées), fusion API client > photo, fiche + curseurs « suggéré par l'IA ».
Tests : pytest 79 (94 %), API patterns verts, web wizard 72. ⚠️ Stitch non consulté pour ces blocs UI ; l'appel IA
« texte seul » ne demande pas encore les paramètres étendus ; e2e Playwright non écrit.

**Correctif UX (même commit)** : « Générer mon patron » — l'écran de chargement reste affiché pendant la requête
**et** jusqu'à la redirection (avant : le wizard réapparaissait entre la fin de la requête et l'ouverture de
l'aperçu), étapes animées + compteur + message « toujours en cours », bouton « Génération… » désactivé,
`loading.tsx` sur `/pattern-studio/projects/[projectId]`, et bannière d'erreur si la génération échoue.
Tests : `GenerationLoading.test.tsx`, `PatternStudioWizard.generate.test.tsx`.

**Prochaine action : S4** — blocs de drapé déterministes (jupe froncée/plissée/cercle, portefeuille, col bénitier :
`packages/pattern-engine/src/blocks/*.ts`, `DrapeSpec`, métrage indicatif, `warnings[]`) — voir la phase 5b §S4.
(Ancien texte S3 :) l'analyse photo remplit `ease/fullness/lengths` (prompt + `normalize_profile`
bornage + fusion API client > photo > IA) et écran « Ajustements déduits de la photo » (consulter Stitch via
`agy` avant JSX). Dette : brancher les mesures restantes du catalogue (sous-poitrine, hauteur de poitrine,
carrures, cuisse…), migrer l'avertissement AUTRE dans la règle.

---

## 0. Session précédente (2026-10-08) — Phase 5b S1 + catalogue de mesures

**Livré (S1)** : contrat de paramètres étendus (`ease`, `fullness`, `lengths`) + **catalogue de 31
mesures** pour l'ajustement (`packages/types/src/pattern-fit.ts`).
- Types : bornes, `validatePatternExtParameters` (rejet, jamais de clamp), `validateMeasurementValues`,
  `checkMeasurementCoherence`, `measurementFieldsFor(garment)`.
- DB : `pattern_projects.parametersExtJson` (migration `20261008130000_…`, client Prisma régénéré).
- API : PATCH projet valide/stocke les paramètres (400 hors bornes) ; génération les revalide et les
  passe au moteur ; profils de mesures + mesures de génération validés (400 « Mesures invalides »).
- Moteur : champs optionnels dans `PatternParameters` — **aucun contour modifié**
  (`ease-contract.test.ts`).
- Web : étape Mesures adaptée au vêtement (indispensables / recommandées / « plus de mesures »
  groupées), erreurs de plausibilité et avertissements de cohérence, curseurs aisance/ampleur/
  longueurs (`FitAdjustments`), formulaire « Mes mesures » groupé (schéma Zod tolère les champs vides).
- Tests : API 1239, web 946, pattern-engine 95, pytest 59 — tous verts ; `pnpm typecheck` 10/10.

**À savoir / dette**
- ⚠️ **Maquette Stitch non consultée** pour les nouveaux blocs JSX (`FitAdjustments`,
  `MeasurementFieldCard`, groupes du tiroir « Mes mesures ») : styles repris de l'existant. À
  vérifier via `agy` puis ajouter la ligne dans `docs/mockup-reference.md`.
- `pnpm lint` de `apps/api` était déjà rouge avant (≈250 erreurs hors périmètre).
- L'IA d'estimation ne produit que les 6 clés historiques ; les 25 autres se saisissent à la main.
- Le changement non commité des sessions précédentes (inspiration, ai-service…) est toujours dans l'arbre.

**Prochaine action : S2** — `shared/ease-profile.ts` + `shared/proportions.ts`, brancher `ease`,
`lengths`, `fullness` et les nouvelles mesures (tour sous-poitrine, hauteur de poitrine, carrures,
hauteur de fourche, tour de cuisse…) dans les règles une par une (skill `pattern-engine-rule`),
`warnings[]` dans le contrat moteur ; `CONFORT` doit rester identique aux snapshots.

---

## 1. Résumé exécutif de la session

### Fournisseurs d'IA multiples (`docs/features/ai-providers.md`) — ✅ Livré de bout en bout (Phases 1 à 7)

Toutes les étapes du plan d'implémentation de la fonctionnalité Fournisseurs d'IA multiples (`/admin/ai-settings`) ont été achevées, intégrées et testées :

1. **Phase 1 — Maquette & Alignement Haute Couture Stitch** :
   - Génération et validation via StitchMCP du tiroir slide-over de configuration : écran `acd304bc8fcf48fb900733db616f49c4` (« ANGALY Back-office — Connecter Claude (Anthropic) ») complétant l'écran principal `996ac3c27a3b4a099126604d383203ad`.
   - Arbitrage rigoureux des 5 points de copy : remplacement de « Quota illimité » par l'offre contractuelle réelle (`tierLabel`) ; latence réelle mesurée (`lastLatencyMs`) sans faux compteurs de requêtes mensuelles ; retrait du bouton mort « Rapports de précision biométrique » ; neutralisation géographique exacte (« sur les serveurs sécurisés d'ANGALY ») ; remplacement du badge sans définition par « Patronage Déterministe » (ADR-005).

2. **Phase 2 — Schéma PostgreSQL & Types Partagés** :
   - Modèle Prisma `AiProviderConfig` et enums `AiProviderId` (12 providers : Anthropic, Gemini, OpenAI, Meta Muse, Mistral, Groq, OpenRouter, DeepSeek, Together, Cerebras, Custom OpenAI/Ollama, Local Statistical), `AiProviderStatus`, `AiUsage`.
   - Migration Prisma appliquée : `20261002134653_add_ai_provider_configs`.
   - Package `@angaly/types` (`packages/types/src/ai-providers.ts` et `index.ts`) exportant les types partagés (`AiProviderCatalogEntry`, `AiProviderConfigView`, `UpsertAiProviderDto`, `AiRoutingSetting`, `UpdateAiRoutingDto`, `ProviderCredentials`, `TestAiProviderResponse`) compatibles `exactOptionalPropertyTypes: true`.
   - Clé secrète `AI_KEYS_ENCRYPTION_KEY` (AES-256-GCM 32 octets base64) documentée dans `docs/deployment.md` et `docs/environment-variables.md`.

3. **Phase 3 — Clean Architecture Backend API (`apps/api/src/admin-ai-settings`)** :
   - **Domain** : Entités `AiProviderConfigEntity`, `AiModelSetting`, ports `IAiProviderConfigRepository`, `ISecretCipher`, catalogue statique `AI_PROVIDER_CATALOG` (12 entrées). Zéro dépendance technique.
   - **Infrastructure** : Chiffrement symétrique `AesGcmSecretCipher` (AES-256-GCM avec vérification du tag d'authentification et IV aléatoire 96 bits), `PrismaAiProviderConfigRepository`, `PrismaAiModelSettingRepository`.
   - **Application** : Use cases `ListAiProvidersUseCase` (catalogue + configs masquées `••••••••3f9a`), `UpsertAiProviderUseCase` (chiffrement et validation SSRF pour baseUrl privées/metadata), `RemoveAiProviderUseCase` (garde empêchant de supprimer un provider actif), `TestAiProviderUseCase` (test avec latence réelle), `GetAiModelSettingUseCase`, `UpdateAiRoutingUseCase`.
   - **Presentation** : Contrôleur `AdminAiProvidersController` (`GET`, `PUT`, `DELETE`, `POST test` sur `/admin/ai-settings/providers`), `AiModelSettingsController` étendu, Swagger `@ApiOperation`, `@ApiResponse`, `@ApiBearerAuth`, gardes RBAC `@Roles(Role.ADMIN)`.
   - Tests Jest : 42/42 tests unitaires et intégration passés avec succès.

4. **Phase 4 — Inférence Multi-fournisseur `apps/ai-service` (FastAPI / Python)** :
   - Package de fournisseurs `apps/ai-service/app/services/providers/` :
     - `base.py` : classe abstraite `LlmProvider` et fonction utilitaire `clean_json_text`.
     - `ssrf.py` : validation SSRF bloquant les métadonnées cloud (`169.254.169.254`, `metadata.google.internal`), boucles locales et réseaux privés (hors dev/whitelist).
     - `gemini_provider.py` : intégration officielle Google GenAI SDK avec `test_connection`.
     - `anthropic_provider.py` : intégration officielle Anthropic SDK avec `test_connection` et extraction de JSON structuré.
     - `openai_compatible_provider.py` : intégration officielle OpenAI SDK paramétrable par `base_url` pour OpenAI, Mistral, Groq, OpenRouter, DeepSeek, Together, Cerebras, Meta Muse et Custom/Ollama.
     - `factory.py` : instanciation dynamique `get_llm_provider(credentials)`.
   - Schémas Pydantic synchronisés dans `app/schemas.py` (`ProviderCredentials` masquant la clé API dans `__repr__`, `TestProviderRequest`, `TestProviderResponse`).
   - Endpoint `POST /v1/providers/test` mesurant la latence réelle en millisecondes.
   - Tests pytest : 42/42 tests passés avec 95% de couverture de code (`apps/ai-service/.venv/bin/pytest`).

5. **Phase 5 — Intégration `apps/api` `ai-inference`** :
   - Service `AiProviderResolverService` : résout le fournisseur configuré en base selon l'usage (`MEASUREMENT_ESTIMATION` ou `PATTERN_SUGGESTION`), déchiffre la clé secrète avec `AesGcmSecretCipher` et transmet les `ProviderCredentials` à `apps/ai-service`.
   - Use cases mis à jour : `SuggestPatternParametersUseCase` et `EstimateMissingMeasurementsUseCase` transmettent les credentials au client HTTP `AiServiceHttpClient`.
   - Chaîne de repli automatique : si le fournisseur distant échoue ou n'est pas configuré, bascule gracieusement sur `LOCAL_STATISTICAL` (ANSUR II) pour les mesures ou le Gemini par défaut pour le style sans bloquer l'Atelier.
   - Tests Jest : 26/26 tests unitaires et intégration passés dans `src/ai-inference`.

6. **Phase 6 — Frontend Haute Couture `apps/web` (`/admin/ai-settings`)** :
   - Ajout de la méthode `put` dans [`apps/web/src/lib/api-client.ts`](file:///home/tokiarivelo/Documents/Projects/angaly/apps/web/src/lib/api-client.ts).
   - Couche API & hooks react-query sous [`apps/web/src/features/admin-ai-settings/`](file:///home/tokiarivelo/Documents/Projects/angaly/apps/web/src/features/admin-ai-settings/) : `ai-providers.api.ts`, `useAiProviders.ts`, `useAiRouting.ts`, `useUpdateAiRouting.ts`, `useUpsertAiProvider.ts`, `useRemoveAiProvider.ts`, `useTestAiProvider.ts`.
   - Composants Haute Couture conformes aux maquettes Stitch :
     - `ActiveModelSection.tsx` : sélecteurs d'usage (Mesures vs Suggestions) avec repli ANSUR II explicité.
     - `ConnectedProviderCard.tsx` : cartes de fournisseurs actifs avec monogrammes, statut, modèle ciblé, clé masquée, latence mesurée, actions Tester, Modifier, Supprimer.
     - `ProviderCatalogGrid.tsx` : catalogue filtrable (Tous, Gratuit, Payant, Auto-hébergé) avec boutons « Connecter », « Modifier », « Configurer l'hôte local ».
     - `ActiveModelSummary.tsx` : récapitulatif du modèle actif, latence, offre et avertissement déontologique.
     - `EngineGuaranteeBanner.tsx` : bandeau de garantie architecturale ANGALY (zéro géométrie générée par un tiers, ADR-005).
     - `ConnectProviderDrawer.tsx` : tiroir slide-over avec affichage/masquage de clé secrète, validation, sélection de modèle suggéré et bouton de test direct.
     - `AiSettingsPage.tsx` : assemblage de la page avec états de chargement.
   - Tests Vitest : 9 suites / 17 tests passés avec succès. Typecheck strict : 0 erreur.

7. **Phase 7 — Documentation & Traçabilité** :
   - Mise à jour de [`docs/pages/admin-ai-settings.md`](file:///home/tokiarivelo/Documents/Projects/angaly/docs/pages/admin-ai-settings.md), [`docs/features/ai-providers.md`](file:///home/tokiarivelo/Documents/Projects/angaly/docs/features/ai-providers.md), [`docs/mockup-reference.md`](file:///home/tokiarivelo/Documents/Projects/angaly/docs/mockup-reference.md), [`docs/checklist-implementation.md`](file:///home/tokiarivelo/Documents/Projects/angaly/docs/checklist-implementation.md), [`docs/environment-variables.md`](file:///home/tokiarivelo/Documents/Projects/angaly/docs/environment-variables.md).

---

## 2. État du dépôt Git (Arbre de travail)

Modifications locales vérifiées et prêtes :
- `packages/database/prisma/schema.prisma` & migration `20261002134653_add_ai_provider_configs`
- `packages/types/src/ai-providers.ts` & `packages/types/src/index.ts`
- `apps/api/src/admin-ai-settings/` (modules, use cases, ports, infrastructure crypto AES-GCM et SSRF, DTOs, controllers, tests)
- `apps/api/src/ai-inference/` (service de résolution, use cases mis à jour, client HTTP avec credentials, tests)
- `apps/ai-service/app/services/providers/` (base, gemini, anthropic, openai_compatible, ssrf, factory)
- `apps/ai-service/app/schemas.py`, `app/inference.py`, `app/main.py`, `requirements.txt`
- `apps/ai-service/tests/` (test_providers.py, test_ssrf.py, test_provider_test_endpoint.py, test_multi_provider_inference.py)
- `apps/web/src/lib/api-client.ts` (méthode `put`)
- `apps/web/src/features/admin-ai-settings/` (API client, hooks, consts, composants UI, tests)
- `apps/web/src/app/(admin)/ai-settings/page.tsx`
- Documentation synchronisée : `docs/pages/admin-ai-settings.md`, `docs/features/ai-providers.md`, `docs/mockup-reference.md`, `docs/checklist-implementation.md`, `docs/environment-variables.md`, `docs/handoff.md`.

---

## 3. Vérifications & Tests validés

| Test / Commande | Portée | Résultat |
| :--- | :--- | :--- |
| `pnpm typecheck` | Monorepo complet (10 packages Turbo) | ✅ **0 erreur** (10/10 succès) |
| `apps/ai-service/.venv/bin/pytest --cov=app` | Service IA Python (Multi-provider, SSRF, Test endpoint) | ✅ **42 tests passés, 95% couverture** |
| `pnpm --filter @angaly/api test src/admin-ai-settings src/ai-inference` | API Backend (Fournisseurs, Chiffrement AES, SSRF, Inférence) | ✅ **68 tests passés** (20 suites) |
| `pnpm --filter @angaly/web exec vitest run src/features/admin-ai-settings/` | Web Paramètres IA (Composants, Hooks, Tiroir Stitch) | ✅ **17 tests passés** (9 suites) |
| `pnpm --filter @angaly/web test` | Ensemble des tests unitaires et intégration Web | ✅ **850 tests passés** (256 suites) |

---

## 4. Prochaines actions prioritaires pour l'agent suivant

1. **Test E2E Playwright de la page `/admin/ai-settings`** :
   - Rédiger un test E2E simulant un administrateur se connectant au back-office, accédant à `/admin/ai-settings`, ouvrant le tiroir pour configurer un fournisseur (ex: Anthropic), testant la connexion et modifiant le routage par défaut.
   - Fichier cible : `apps/web/e2e/admin-ai-settings.spec.ts`.

2. **Éventuel compteur d'usage mensuel (Télémétrie IA)** :
   - Si le produit souhaite réintroduire le compteur « 148 requêtes ce mois » relevé sur la maquette Stitch, créer une table `ai_usage_logs` (`provider`, `usage`, `tokensCount`, `latencyMs`, `createdAt`) pour enregistrer la consommation réelle sans chiffres simulés.

---

## 5. Rappels d'architecture et pièges connus

- **Pages Next.js sans logique** : Tout composant sous `apps/web/src/app/` doit être un simple wrapper exportant le composant de feature (`features/<name>/ui/<Component>`). Zéro hook, zéro état local dans les fichiers `page.tsx`.
- **`exactOptionalPropertyTypes: true`** : Dans `apps/web` et `@angaly/types`, tout champ optionnel `field?: T` qui peut recevoir `undefined` doit explicitement typer `field?: T | undefined;`.
- **Clean Architecture NestJS** : Le `Domain` et l'`Application` n'importent jamais `@prisma/client` ni NestJS. Les repositories injectent des interfaces définies dans le domaine.
- **Sécurité des secrets** : Les clés API des tiers sont chiffrées avec AES-256-GCM dans PostgreSQL (`apiKeyCipher`) et masquées à la sortie (`apiKeyMasked`, ex: `••••••••3f9a`). Seul `apps/api` possède la clé `AI_KEYS_ENCRYPTION_KEY`.
- **SSRF** : Ne jamais autoriser une `baseUrl` pointant vers des réseaux privés ou des métadonnées cloud (`169.254.169.254`) sans validation par `SsrfValidator` (NestJS) et `validate_url_ssrf` (FastAPI).

## 2026-10-07 — Pipeline photos d'inspiration (économie de tokens)

- Fait : `AnalyzeInspirationImageUseCase` (download → SHA-256 → cache `inspiration_analyses` → sharp 1024 px JPEG →
  `POST /v1/pattern/analyze-inspiration` → JSON compact), `suggest-pattern-parameters` en texte seul via
  `inspirationFeatures`, vision Anthropic/Gemini/OpenAI-compatible (`generate_json_from_image`).
- Tests : `pnpm --filter @angaly/api exec jest src/ai-inference src/admin-ai-settings` (92 ✓), `ai-service` pytest (46 ✓).
- À faire : appliquer la migration `20261007120000_add_inspiration_analyses` (`pnpm --filter @angaly/database exec prisma migrate deploy`) ;
  brancher l'upload de photo côté UI Pattern Studio / projet de création (passer l'URL MinIO en `inspirationImageUrl`) ;
  envisager un modèle de vision dédié (Haiku / Gemini Flash) distinct du modèle de suggestion ; nettoyer les erreurs ESLint
  historiques de `ai-inference`.

## 2026-10-07 (suite) — Choix du modèle + apprentissage

- Fait : sélecteur « Modèle IA » dans le wizard (étapes 4 et 7) ; `GET /ai-inference/selectable-providers` ;
  `aiProvider` sur suggestions et génération ; table `pattern_learning_records` (migration `20261007150000`,
  appliquée en local) ; `PatternLearningService` + repli sur l'historique ; photo d'inspiration dans la modale IA
  des projets de création ; lint des fichiers de production d'`ai-inference`.
- Tests : api `jest src/ai-inference src/patterns` ✓, web `vitest src/features/pattern-studio-wizard` ✓, ai-service pytest 48 ✓.
- À faire : vérifier visuellement le sélecteur sur la maquette Stitch (non consultée) ; apprendre des corrections de
  mesures ; `ai-assistant.controller` lit `req.user.id` alors que le payload JWT expose `sub` (bug probable existant).


## Addendum 2026-10-08 — Pattern Studio : Inspiration en premier + pré-remplissage IA

- Étapes : Inspiration → Vêtement → Occasion → Style → Coupe → Détails → Mesures ; `?step=<clé>` dans l'URL (reprise après refresh).
- ai-service : `app/garment_knowledge.py` (taxonomie fermée, procédure, few-shot, `normalize_profile`) ; `analyze-inspiration` renvoie `profile` (`isGarment`, type, occasion, style, coupe, détails). Photo non-vêtement ⇒ rien de pré-rempli.
- API : colonne `inspiration_analyses.profile` (migration `20261008100000…` **à appliquer** : `pnpm --filter @angaly/database prisma migrate deploy`) ; le contrôleur renvoie `profile`.
- À faire : vérifier l'écran Stitch réel (ordre des étapes changé sur demande utilisateur), mettre à jour `docs/pages/` + `mockup-reference.md`, e2e Playwright, suite vitest complète (lancée en arrière-plan, non vérifiée).

## Addendum 2026-10-08 (2) — Observations persistées, construction (drapé/mannequin), paramètres optimaux
- `pattern_projects.inspirationAnalysisJson` (migration `20261008120000…`, **à appliquer**) : observations + profil du vêtement ; envoyé à chaque autosave, restauré au rechargement.
- ai-service : le profil contient `constructionMethod` (FLAT_PATTERN | DRAPING | MIXED), `presentation` (WORN | MANNEQUIN | FLAT | SKETCH), `constructionNotes`.
- Génération (`GeneratePatternVersionUseCase`) : choix du client prioritaires → trous comblés par la photo (`InspirationParametersService`, valeurs validées) → puis par l'IA (texte seul, best-effort). Avertissement si drapé/mixte (« à finaliser sur mannequin »). Tout est tracé dans `parametersJson.inspiration`.
- Limite : le moteur reste plat et déterministe (ADR-005) ; les observations libres (tissu, silhouette) alimentent l'IA mais ne modifient pas encore directement la géométrie. `PATTERN_DETAIL_OPTIONS` (API) doit rester synchronisé avec `details.const.ts` (web) et `garment_knowledge.py`.

## Addendum 2026-10-08 (3) — Plan Phase 5b
Plan complet (S1→S8) : `docs/phases/phase-5b-fidelite-photo-et-drapes.md` — paramètres étendus (aisance/ampleur/longueurs), blocs de drapé déterministes, jeu de référence + métriques, modèle local entraîné sur `ai_training_samples`, RGPD. Prochaine action : session S1. Ajouter la ligne Phase 5b à `docs/checklist-implementation.md`.
