# Page — `admin-ai-settings`

**Statut : ✅ Implémenté (Multi-fournisseurs).** Spécifié dans `docs/features/ai-providers.md`.
Maquettes Google Stitch :
- Écran principal : `996ac3c27a3b4a099126604d383203ad` (« ANGALY Back-office — Paramètres IA Pattern Studio »).
- Tiroir de connexion : `acd304bc8fcf48fb900733db616f49c4` (« ANGALY Back-office — Connecter Claude (Anthropic) »).
Prompt source : `stitch-prompts/33-admin-ai-settings-fournisseurs.md`.

## Objet

Écran ADMIN-only permettant de connecter et configurer de multiples fournisseurs d'IA
(Claude, Gemini, OpenAI, Meta Muse Spark, Mistral, Groq, OpenRouter, DeepSeek, Together AI, Cerebras,
Ollama / compatible OpenAI, et modèle statistique local ANSUR II) et de choisir lequel sert chaque usage
(estimation de mesures manquantes, suggestion de coupe et détails) dans Angaly Pattern Studio.
Design System Haute Couture ANGALY (Deep Navy `#061938`, Ivory `#F6F2E9`, Antique Gold `#936C3E`, Champagne `#C5B190`, angles nets `rounded-sm`).

## Route(s)

- `apps/web/src/app/(admin)/dashboard/page.tsx` → `/admin/dashboard` — landing,
  grille de sections.
- `apps/web/src/app/(admin)/ai-settings/page.tsx` → `/admin/ai-settings` — re-vérifie
  `session.user.role === Role.ADMIN` explicitement (le layout `(admin)` ne gate que
  `STAFF_ROLES`, plus large) et redirige vers `/admin/dashboard` sinon.
- `apps/web/src/app/(admin)/layout.tsx` — enveloppe les pages dans
  `AdminLayout` (sidebar `AdminSidebar` + zone de contenu).

## Arborescence de composants

```
apps/web/src/features/admin-ai-settings/
  api/ai-providers.api.ts         → GET /api/admin/ai-settings/providers, PUT .../:provider, DELETE .../:provider, POST .../:provider/test, GET/PATCH /api/admin/ai-settings
  hooks/
    useAiProviders.ts             → liste des configs et du catalogue
    useAiRouting.ts               → routage par usage d'atelier
    useUpdateAiRouting.ts         → mutation PATCH routage
    useUpsertAiProvider.ts        → mutation PUT configuration de fournisseur
    useRemoveAiProvider.ts        → mutation DELETE configuration
    useTestAiProvider.ts          → mutation POST test de connectivité
  consts/
    ai-providers.consts.ts        → query keys, monogrammes & palettes Haute Couture, libellés de facturation
  ui/
    ActiveModelSection.tsx        → sélection dynamique du moteur par usage (mesures vs suggestions de patron)
    ConnectedProviderCard.tsx     → cartes des fournisseurs actifs (statut, modèle, clé masquée, latence, test, édition, suppression)
    ProviderCatalogGrid.tsx       → catalogue filtrable (Tous, Gratuit, Payant, Auto-hébergé)
    ActiveModelSummary.tsx        → récapitulatif du modèle actif, latence, offre et avertissement déontologique
    EngineGuaranteeBanner.tsx     → garantie architecturale ANGALY (zéro géométrie générée par un tiers, ADR-005)
    ConnectProviderDrawer.tsx     → tiroir slide-over de connexion/configuration (modèle, clé API masquée, baseUrl SSRF-safe, test direct)
    AiSettingsPage.tsx            → vue principale assemblant l'ensemble
  __tests__/
  index.ts
```

## Endpoints API consommés

| Endpoint | Module | Usage |
| --- | --- | --- |
| `GET /api/admin/ai-settings/providers` | `admin-ai-settings` | Récupération des fournisseurs configurés et du catalogue statique |
| `PUT /api/admin/ai-settings/providers/:provider` | `admin-ai-settings` | Création / modification d'un fournisseur (chiffrement AES-256-GCM) |
| `DELETE /api/admin/ai-settings/providers/:provider` | `admin-ai-settings` | Suppression d'une configuration tiers |
| `POST /api/admin/ai-settings/providers/:provider/test` | `admin-ai-settings` | Test de connexion en direct avec diagnostic et latence |
| `GET /api/admin/ai-settings` | `admin-ai-settings` | Routage des modèles par usage d'atelier |
| `PATCH /api/admin/ai-settings` | `admin-ai-settings` | Modification du routage d'atelier |

## Points d'attention

- Le contrôle ADMIN-only est fait **côté serveur** (page.tsx) en plus du guard
  `RolesGuard`/`@Roles(Role.ADMIN)` côté API — jamais uniquement côté client.
- Les clés API secrètes sont chiffrées avec AES-256-GCM (`AI_KEYS_ENCRYPTION_KEY`) au repos dans PostgreSQL et ne sont **jamais** renvoyées au client en clair (masquage `••••••••3f9a`).
- Seul `apps/api` (`ai-inference`) contacte `apps/ai-service` via le réseau interne. L'application frontend ne contacte jamais directement les fournisseurs d'IA.
- Protection SSRF rigoureuse sur les `baseUrl` personnalisées (OpenAI compatible / Ollama) côté API et côté `ai-service`.

## Checklist d'acceptation

- [x] `/admin/dashboard` et `/admin/ai-settings` protégés (redirection si non-staff / non-admin)
- [x] Sélection et routage dynamique par usage d'atelier
- [x] Tiroir de connexion conforme à la maquette Stitch `acd304bc8fcf48fb900733db616f49c4`
- [x] Tests unitaires & intégration : Jest (API), Pytest (`ai-service`), Vitest (Frontend)
- [x] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour

