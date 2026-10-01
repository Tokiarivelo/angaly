# Page — `espace-client-dashboard`

**Statut : ✅ Fait** (agrégation multi-requêtes réelle + refonte visuelle haute fidélité alignée sur la maquette Stitch `6740739cfa4644d88cdd4dacc644e2b7`). Phase 3 — Production. Mis à jour le 2026-10-01.

`useDashboardSummary.ts` compose `GET /customers/me`, `GET /api/appointments`,
`GET /api/ateliers`, `GET /api/orders`, `GET /api/pattern-projects?mine=true` et
`GET /api/notifications` via react-query — pas d'endpoint agrégé dédié côté backend.
`useRecentActivity.ts` dérive un flux chronologique à partir des mêmes données.
Refonte graphique couture (session 2026-10-01) : palette de contrastes couture (`#061938` marine profond, `#C5B190` champagne, `#936C3E` or antique), sidebar couture avec avatar et statut privilège, 4 cartes résumé stylisées, grille 2×2 d'accès rapide avec inversion sombre au survol, timeline d'activité à puces champagne, et footer minimaliste. Redirection intelligente : les clients accédant à `/dashboard` sont redirigés vers `/espace-client`.

## Objet

Écran d'accueil de l'espace client authentifié (spec §51-52) : vue agrégée cross-module
(prochain rendez-vous, commande en cours, projet Pattern Studio en cours, notifications
récentes, activité récente) donnant un accès rapide à toutes les sections de l'espace client.
Uniquement de la lecture agrégée, aucune mutation propre hormis la navigation.

## Route(s)

- `apps/web/src/app/(client)/espace-client/page.tsx` → `/espace-client`
- Les visiteurs sans rôle staff accédant à `/dashboard` sont redirigés automatiquement vers `/espace-client` (via `apps/web/src/app/(admin)/layout.tsx`).

Server Component par défaut (résumé en lecture seule) ; les widgets sont hydratés via
react-query pour rester à jour sans rechargement complet — même approche que `home`.

## Référence maquette

- Prompt Stitch : `stitch-prompts/25-espace-client-dashboard.md`
- Écran Stitch : **ANGALY — Espace Client (Tableau de bord)** (`6740739cfa4644d88cdd4dacc644e2b7`)
- Section spécification : §51-52 (`docs/specifications/ANGALY_Specifications_Completes.md`)

## Arborescence de composants attendue

```
apps/web/src/features/espace-client-dashboard/
  ui/
    ClientSpaceLayout.tsx          → shell de l'espace client (sidebar desktop + topbar mobile + footer)
    ClientSpaceSidebar.tsx         → sidebar couture #061938, logo ANGALY or, badge privilège
    EspaceClientDashboardPage.tsx  → orchestre header de bienvenue + 4 widgets résumé + 2/3 accès rapide + 1/3 activité récente
    WelcomeHeader.tsx              → "Bonjour, {prénom}" + date en capitales + CTA "Prendre un rendez-vous"
    NextAppointmentCard.tsx        → prochain rendez-vous, statut "CONFIRMÉ", atelier, date
    CurrentOrderCard.tsx           → commande en cours, vignette tissu marine, étape de confection
    PremiumProjectCard.tsx         → bordure champagne, filigrane compas, accent Pattern Studio
    NotificationsPreviewCard.tsx   → dernières notifications avec puces d'alerte non lues
    QuickAccessTilesGrid.tsx       → 4 tuiles 2×2 s'inversant en marine foncé/or au survol
    RecentActivityTimeline.tsx     → timeline verticale avec points champagne et horodatage
  hooks/
    useDashboardSummary.ts         → agrège prochain rendez-vous + commande en cours + projet
                                      Premium en cours + notifications via plusieurs requêtes
                                      react-query
    useRecentActivity.ts           → flux d'activité récente cross-module
  api/
    dashboard.api.ts               → useDashboardSummaryQuery, useRecentActivityQuery
  consts/
    queryKeys.ts
  types/
    dashboard-summary.types.ts
  __tests__/
    useDashboardSummary.test.ts
    EspaceClientDashboardPage.test.tsx
    DashboardCards.test.tsx
  index.ts
```

Toute logique (agrégation, activité récente) vit dans `hooks/` ; `EspaceClientDashboardPage.tsx`
et les composants `ui/` ne contiennent que du JSX + appels de hooks. La sidebar de navigation
cliente n'appartient pas à cette feature (voir point d'attention).

## Endpoints API consommés

Réellement appelés (aucun des paramètres `?limit=`/`?status=in_progress` ci-dessous n'existe
côté backend — chaque liste complète est filtrée/triée côté frontend dans
`useDashboardSummary.ts`/`useRecentActivity.ts`) :

| Endpoint | Module | Usage |
| --- | --- | --- |
| `GET /customers/me` | `customers` | Prénom pour "Bonjour, {prénom}" |
| `GET /api/appointments` | `appointments` | Liste complète → le prochain rendez-vous à venir est dérivé côté frontend |
| `GET /api/ateliers` | `ateliers` | Résolution du nom/adresse de l'atelier du prochain rendez-vous |
| `GET /api/orders` | `orders` | Liste complète → la commande "en cours" la plus récente est dérivée côté frontend |
| `GET /api/pattern-projects?mine=true` | `patterns` | Liste complète → le projet actif est dérivé côté frontend |
| `GET /api/notifications` | `notifications` | Liste complète → les 3 plus récentes sont gardées côté frontend |

## Modèles Prisma touchés

`Appointment` (lecture, prochain à venir), `Order` (lecture, "en cours" = statut ∈
`{CONFIRMED, PAID, IN_PRODUCTION, READY}`, ni brouillon `PENDING` ni terminal
`DELIVERED`/`CANCELLED`/`REFUNDED`), `PatternProject` + `PatternVersion` (statut du projet en
cours), `Notification`, `Customer`.

## Points d'attention

- Le widget "dernière création" évoqué en spec §52 recouvre en réalité le pipeline détaillé de
  spec §53 ("Mes créations") qui n'a pas de modèle Prisma dédié pour ses statuts intermédiaires
  — voir le point d'attention approfondi de `docs/pages/suivi-commande.md` (§54-55). En Phase 3,
  se limiter ici à un lien vers `suivi-commande`/`mes-rendez-vous` plutôt que de dupliquer une
  logique de statut non stabilisée.
- Envisager un endpoint agrégé côté backend (`GET /api/customers/me/dashboard-summary`) plutôt
  que 4 requêtes séparées côté client, pour limiter les allers-retours au chargement — décision
  d'implémentation à trancher avec le backend ; cette fiche documente l'intention fonctionnelle,
  pas le détail de l'agrégation.
- L'accent champagne de `PremiumProjectCard` est réservé aux éléments Pattern Studio
  (cohérence avec la charte Premium définie dans `pattern-studio-wizard.md`) — ne jamais
  réutiliser cet accent ailleurs sur le dashboard.
- La sidebar de navigation cliente (Tableau de bord, Mes rendez-vous, Mes commandes, Mes
  créations, Mes projets de patron, Mes mesures, Mes favoris, Mes messages, Mes factures,
  Notifications, Paramètres, Déconnexion) est **partagée** par toutes les pages `(client)` de
  l'espace client (celle-ci, `mes-rendez-vous`, `suivi-commande`,
  `messages-factures-notifications`) — factoriser dans un layout partagé
  (`apps/web/src/app/(client)/layout.tsx` ou un composant `ClientSpaceSidebar` hors feature)
  plutôt que de la dupliquer dans chaque feature ; cette fiche ne redécrit donc pas la sidebar
  dans son arborescence de composants.
- Certaines entrées de la sidebar (Mes commandes, Mes créations, Mes projets de patron, Mes
  mesures, Paramètres du compte) ne font pas partie du présent lot de pages à documenter — les
  liens/tuiles doivent pointer vers des routes prévues même si leurs fiches ne sont pas encore
  rédigées, comme déjà pratiqué pour le lien "Prendre rendez-vous" de `home.md`.
- Mobile : sidebar remplacée par une barre d'onglets basse (Accueil, Rendez-vous, Commandes,
  Compte) + hamburger pour le reste, cartes résumé empilées en une colonne.

## Checklist d'acceptation

- [x] Les 4 cartes résumé (rendez-vous, commande, projet Premium, notifications) affichent des
      données réelles ou un état vide cohérent si absentes
- [x] Carte "Projet Premium en cours" visuellement distincte (accent champagne) uniquement si un
      `PatternProject` actif (`GENERATING`/`GENERATED`/`REVIEW_REQUIRED`/`CORRECTION_REQUIRED`)
      existe
- [x] Tuiles d'accès rapide et liens de la sidebar fonctionnels vers les pages existantes ou prévues
- [x] Timeline d'activité récente à jour, ordonnée chronologiquement (dérivée des
      rendez-vous/commandes/notifications réels)
- [x] Refonte visuelle haute fidélité alignée sur l'écran Stitch `6740739cfa4644d88cdd4dacc644e2b7` (sidebar marine #061938, tuiles 2×2 à inversion de couleur, typographie couture, footer minimaliste)
- [x] Redirection transparente des clients naviguant vers `/dashboard` vers `/espace-client`
- [x] Tests : `useDashboardSummary.test.ts` (5 tests), `EspaceClientDashboardPage.test.tsx` (2 tests), `DashboardCards.test.tsx` (11 tests), `useIsStaff.test.ts` (5 tests)
- [x] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
