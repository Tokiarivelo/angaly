# Page — `mes-rendez-vous`

**Statut : ⬜ À faire.** Phase 3 — Production.

## Objet

Liste et gestion des rendez-vous du client connecté (spec §51) : à venir, passés, annulés,
avec actions de modification/annulation/ajout au calendrier, et accès rapide à la prise d'un
nouveau rendez-vous.

## Route(s)

`apps/web/src/app/(client)/mes-rendez-vous/page.tsx` → `/mes-rendez-vous`

Server Component pour le rendu initial de la liste ; filtres et actions (annuler, ajouter au
calendrier) hydratés côté client.

## Référence maquette

- Prompt Stitch : `stitch-prompts/26-espace-client-rendezvous-suivi.md` (Écran A — Mes rendez-vous)
- Écran Stitch : **ANGALY — Mes rendez-vous**
- Section spécification : §51 (`docs/specifications/ANGALY_Specifications_Completes.md`)

## Arborescence de composants attendue

```
apps/web/src/features/mes-rendez-vous/
  ui/
    MesRendezVousPage.tsx        → orchestre header + filtre + liste
    NewAppointmentButton.tsx      → CTA "Prendre un nouveau rendez-vous" → `prendre-rendez-vous`
    AppointmentStatusFilterTabs.tsx → À venir / Passés / Annulés
    AppointmentTicketCard.tsx      → bloc date façon "souche de billet" + type + atelier +
                                      badge statut + actions
    AppointmentStatusBadge.tsx     → pill stylée par `AppointmentStatus`
    AppointmentActionsMenu.tsx     → Modifier / Annuler / Ajouter au calendrier
    EmptyAppointmentsState.tsx
  hooks/
    useMyAppointments.ts           → liste filtrée (à venir/passés/annulés) via react-query
    useCancelAppointment.ts        → mutation d'annulation
    useAddToCalendar.ts            → génère un fichier .ics / lien calendrier
  api/
    appointments.api.ts            → useMyAppointmentsQuery, useCancelAppointmentMutation
  consts/
    queryKeys.ts
  __tests__/
    useMyAppointments.test.ts
    useCancelAppointment.test.ts
    MesRendezVousPage.test.tsx
  index.ts
```

Toute logique (chargement filtré, annulation, export calendrier) vit dans `hooks/` ;
`MesRendezVousPage.tsx` et les composants `ui/` ne contiennent que du JSX + appels de hooks.

## Endpoints API consommés

| Endpoint | Module | Usage |
| --- | --- | --- |
| `GET /api/appointments?customerId=me&filter=upcoming\|past\|cancelled` | `appointments` | Liste filtrée des rendez-vous du client |
| `POST /api/appointments/:reference/cancel` | `appointments` | Annulation (transition vers `CANCELLED`) |

> "Modifier" renvoie vers `prendre-rendez-vous` pré-rempli avec la référence existante, comme
> déjà décidé sur `confirmation-rendez-vous` — pas d'endpoint `PATCH` dédié sur cette page.

## Modèles Prisma touchés

`Appointment` (`customerId`, `type`, `atelierId`, `scheduledAt`, `status`, `assignedToId`),
`Atelier` (nom pour affichage).

## Points d'attention

- Réutiliser (factoriser) `useCancelAppointment`/`useAddToCalendar` et le composant
  `AppointmentStatusBadge` avec les équivalents déjà prévus dans
  `docs/pages/confirmation-rendez-vous.md` plutôt que de les dupliquer — envisager un module
  partagé (`features/_shared/appointments/`) si la duplication devient réelle à
  l'implémentation.
- "Modifier" un rendez-vous renvoie vers `prendre-rendez-vous` pré-rempli avec la référence
  existante, comme sur `confirmation-rendez-vous` — jamais de formulaire d'édition dédié sur
  cette page.
- Les filtres À venir/Passés/Annulés se dérivent de `scheduledAt` (passé/futur) croisé avec
  `status` (`CANCELLED` prioritaire sur la temporalité) — définir précisément la règle de
  classification côté hook plutôt que de la refaire dans chaque composant.
- Un rendez-vous `NO_SHOW` n'a pas d'onglet dédié dans la maquette — décider s'il apparaît sous
  "Passés" (recommandé, avec un badge distinct) avant l'implémentation.
- Mobile : sidebar en barre d'onglets basse, cartes rendez-vous empilées pleine largeur, bloc
  date toujours visible en premier.

## Checklist d'acceptation

- [ ] Reproduit fidèlement `stitch-prompts/26-*.md` Écran A (CTA, filtres, cartes ticket, badges de statut, état vide)
- [ ] Filtres À venir/Passés/Annulés fonctionnels
- [ ] "Modifier" renvoie vers `prendre-rendez-vous` pré-rempli, "Annuler" fonctionnel avec confirmation
- [ ] "Ajouter au calendrier" génère un événement exploitable
- [ ] État vide conforme (icône, message, CTA "Prendre rendez-vous")
- [ ] Tests : `useMyAppointments.test.ts`, `useCancelAppointment.test.ts`, `MesRendezVousPage.test.tsx`
- [ ] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
