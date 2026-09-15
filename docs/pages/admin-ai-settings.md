# Page — `admin-ai-settings`

**Statut : ✅ Fait.** Hors spécification initiale — ajouté sur demande explicite
(session 2026-09-15), voir `docs/features/ai-model-settings.md`.

## Objet

Écran ADMIN-only permettant de choisir le backend d'estimation de mesures
(`GEMINI` ou `LOCAL_STATISTICAL`) utilisé par Pattern Studio. Fait partie d'un
tableau de bord admin minimal (`/admin/dashboard`) créé dans la foulée — aucune
maquette Stitch n'existe pour ces écrans (hors périmètre spec), donc **pas de
vérification `agy`/MCP Stitch requise ici** (contrairement à toute page couverte
par un `stitch-prompts/*.md` existant) ; le style réutilise volontairement les
tokens déjà établis par `espace-client-dashboard` (`bg-white`, `border-border`,
`text-primary-deep-navy`, `text-slate`) plutôt que d'inventer une nouvelle palette.

## Route(s)

- `apps/web/src/app/(admin)/dashboard/page.tsx` → `/admin/dashboard` — landing,
  grille de sections (une seule pour l'instant : Paramètres IA).
- `apps/web/src/app/(admin)/ai-settings/page.tsx` → `/admin/ai-settings` — re-vérifie
  `session.user.role === Role.ADMIN` explicitement (le layout `(admin)` ne gate que
  `STAFF_ROLES`, plus large) et redirige vers `/admin/dashboard` sinon.
- `apps/web/src/app/(admin)/layout.tsx` — enrichi pour envelopper les pages dans
  `AdminLayout` (sidebar `AdminSidebar` + zone de contenu), au lieu de ne faire que
  le contrôle d'accès.

## Arborescence de composants

```
apps/web/src/features/admin-dashboard/
  ui/AdminLayout.tsx      → shell (sidebar + main), monté par (admin)/layout.tsx
  ui/AdminSidebar.tsx      → nav "Tableau de bord" / "Paramètres IA" + déconnexion
  ui/AdminDashboardPage.tsx→ landing, grille de cartes de sections
  __tests__/AdminDashboardPage.test.tsx
  index.ts

apps/web/src/features/admin-ai-settings/
  api/ai-model-settings.api.ts   → GET/PATCH /api/admin/ai-settings, GET /api/ai-inference/available-models
  hooks/useAiModelSetting.ts, useUpdateAiModelSetting.ts, useAvailableAiModels.ts
  ui/AiModelSettingsPage.tsx     → cartes de sélection GEMINI/LOCAL_STATISTICAL,
                                    grise l'option indisponible, affiche la dernière modification
  __tests__/
  index.ts
```

## Endpoints API consommés

| Endpoint | Module | Usage |
| --- | --- | --- |
| `GET /api/admin/ai-settings` | `admin-ai-settings` | Réglage courant |
| `PATCH /api/admin/ai-settings` | `admin-ai-settings` | Changer le modèle |
| `GET /api/ai-inference/available-models` | `ai-inference` | Griser un modèle non chargé côté `apps/ai-service` |

## Points d'attention

- Le contrôle ADMIN-only est fait **côté serveur** (page.tsx) en plus du guard
  `RolesGuard`/`@Roles(Role.ADMIN)` côté API — jamais uniquement côté client.
- Un `COUTURIERE`/`MANAGER` connecté peut atteindre `/admin/dashboard` (gate
  `STAFF_ROLES` du layout) mais est redirigé s'il navigue vers `/admin/ai-settings`.
- Pas de maquette Stitch pour ces écrans — voir la note en tête de fiche.

## Checklist d'acceptation

- [x] `/admin/dashboard` et `/admin/ai-settings` protégés (redirection si non-staff / non-admin)
- [x] Sélection d'un modèle indisponible impossible (bouton désactivé, mention explicite)
- [x] Tests : `AdminDashboardPage.test.tsx`, `AiModelSettingsPage.test.tsx`, 3 fichiers de hooks
- [x] `docs/checklist-implementation.md` mis à jour
