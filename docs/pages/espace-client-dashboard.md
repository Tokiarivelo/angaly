# Page — `espace-client-dashboard`

**Statut : ✅ Fait** (agrégation multi-requêtes réelle, pas d'endpoint agrégé dédié — décision
documentée ci-dessous). Phase 3 — Production. Mis à jour le 2026-09-16.

`useDashboardSummary.ts` (nouveau) compose `GET /customers/me`, `GET /api/appointments`,
`GET /api/ateliers`, `GET /api/orders`, `GET /api/pattern-projects?mine=true` et
`GET /api/notifications` via react-query — pas de `GET /api/customers/me/dashboard-summary`
dédié (l'intention documentée plus bas reste une intention, pas un engagement de cette passe).
`useRecentActivity.ts` (nouveau) dérive un flux chronologique à partir des mêmes données (pas
de table d'activité dédiée). Les cartes `NextAppointmentCard`/`CurrentOrderCard`/
`PremiumProjectCard` affichaient auparavant des dates/statuts codés en dur malgré des props
réelles ; elles affichent maintenant les vraies valeurs.

## Objet

Écran d'accueil de l'espace client authentifié (spec §51-52) : vue agrégée cross-module
(prochain rendez-vous, commande en cours, projet Pattern Studio en cours, notifications
récentes, activité récente) donnant un accès rapide à toutes les sections de l'espace client.
Uniquement de la lecture agrégée, aucune mutation propre hormis la navigation.

## Route(s)

`apps/web/src/app/(client)/espace-client/page.tsx` → `/espace-client`

Server Component par défaut (résumé en lecture seule) ; les widgets sont hydratés via
react-query pour rester à jour sans rechargement complet — même approche que `home`.

## Référence maquette

- Prompt Stitch : `stitch-prompts/25-espace-client-dashboard.md`
- Écran Stitch : **ANGALY — Espace Client (Tableau de bord)**
- Section spécification : §51-52 (`docs/specifications/ANGALY_Specifications_Completes.md`)

## Arborescence de composants attendue

```
apps/web/src/features/espace-client-dashboard/
  ui/
    EspaceClientDashboardPage.tsx → orchestre header de bienvenue + widgets + activité récente
    WelcomeHeader.tsx              → "Bonjour, {prénom}" + date + CTA "Prendre rendez-vous"
    NextAppointmentCard.tsx
    CurrentOrderCard.tsx
    PremiumProjectCard.tsx         → bordure champagne (accent réservé au Pattern Studio)
    NotificationsPreviewCard.tsx   → 2-3 dernières notifications
    QuickAccessTilesGrid.tsx       → Mes créations / Mes mesures / Mes favoris / Mes factures
    RecentActivityTimeline.tsx
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
- [x] Tests : `useDashboardSummary.test.ts` (5 tests), `EspaceClientDashboardPage.test.tsx`
- [x] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
- [ ] `useRecentActivity.test.ts` dédié non ajouté (couvert indirectement par
      `useDashboardSummary.test.ts`/`EspaceClientDashboardPage.test.tsx`) — amélioration possible
