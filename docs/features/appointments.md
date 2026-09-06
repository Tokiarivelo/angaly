# Feature — `appointments`

**Statut : ⬜ À faire.** Phase 2 — Conversion.

## Objet

Prise de rendez-vous (spec §33) : calendrier de disponibilité par atelier (spec §34),
création/consultation/annulation côté client, et confirmation/assignation à une couturière
côté staff (spec §35-36). La gestion interne complète (liste globale, réassignation en
masse) reste un besoin ADMIN non couvert par une maquette Stitch à ce jour — voir la note de
scope Phase 7 dans `docs/checklist-implementation.md`, même limitation que `creations`/`blog`.

## Emplacement Clean Architecture

`apps/api/src/appointments/`

```
domain/
  entities/appointment.entity.ts          → invariants métier (créneau dans les horaires de l'atelier, statut cohérent)
  repositories/appointment.repository.ts  → interface IAppointmentRepository (zéro import Prisma)
  value-objects/appointment-reference.vo.ts → génère/valide la référence unique (ex. ANG-RDV-2026-00001)
application/
  use-cases/
    get-month-availability.use-case.ts    → jours disponibles/complets/fermés du mois pour un atelier
    get-day-slots.use-case.ts             → créneaux horaires du jour sélectionné
    create-appointment.use-case.ts        → statut initial PENDING, associe le Customer si connecté
    get-appointment-by-reference.use-case.ts
    cancel-appointment.use-case.ts        → transition → CANCELLED
    confirm-appointment.use-case.ts       → transition PENDING → CONFIRMED + assignation à un User (staff)
  dtos/
    appointment-response.dto.ts
    availability-response.dto.ts
infrastructure/
  repositories/prisma-appointment.repository.ts → implémente IAppointmentRepository via PrismaService
  services/availability-calculator.service.ts   → croise Atelier.openingHoursJson (via `@angaly/types` AtelierOpeningHours) et les Appointment existants
  mappers/appointment.mapper.ts
presentation/
  controllers/appointments.controller.ts
__tests__/
  unit/get-month-availability.use-case.spec.ts
  unit/create-appointment.use-case.spec.ts
  unit/cancel-appointment.use-case.spec.ts
  integration/appointments.controller.spec.ts
```

## Modèles Prisma

`Appointment` (`reference` unique, `customerId?`, `firstName`, `lastName`, `phone`, `email`,
`type` — enum `AppointmentType`, `atelierId`, `assignedToId?` → `User`, `scheduledAt`,
`durationMinutes`, `status` — enum `AppointmentStatus`, `message?`). Relations : `Customer?`,
`Atelier`, `User?` (`assignedAppointments`).

## Cas d'usage clés

- Calculer la disponibilité d'un mois pour un atelier donné (jours disponibles/complets/
  fermés, spec §34) en croisant `Atelier.openingHoursJson` et les `Appointment` déjà
  planifiés (statuts actifs : `PENDING`/`CONFIRMED`, jamais `CANCELLED`)
- Calculer les créneaux horaires disponibles d'un jour donné pour un atelier
- Créer un rendez-vous (formulaire simple : prénom, nom, téléphone, email, type, atelier,
  date/heure, message) avec statut initial `PENDING`, en associant automatiquement le
  `Customer` si l'utilisateur est connecté
- Consulter un rendez-vous par sa référence (page de confirmation, spec §35)
- Annuler un rendez-vous par sa référence (transition → `CANCELLED`)
- Confirmer/assigner un rendez-vous à une couturière (transition `PENDING` → `CONFIRMED`,
  renseigne `assignedToId`) — usage interne staff, pas encore de page dédiée (voir Objet)

## Endpoints exposés

| Méthode | Route | Use-case | Auth |
| --- | --- | --- | --- |
| `GET` | `/api/appointments/availability?atelierId=&month=` | `get-month-availability` | Public |
| `GET` | `/api/appointments/availability/slots?atelierId=&date=` | `get-day-slots` | Public |
| `POST` | `/api/appointments` | `create-appointment` | Public (enrichi si `CLIENT` connecté) |
| `GET` | `/api/appointments/:reference` | `get-appointment-by-reference` | Public (référence = jeton de consultation) |
| `POST` | `/api/appointments/:reference/cancel` | `cancel-appointment` | Public (référence) ou `CLIENT` propriétaire |
| `POST` | `/api/appointments/:reference/confirm` | `confirm-appointment` | `COUTURIERE`,`MANAGER`,`ADMIN` |

## Points d'intégration

- **`ateliers`** : lecture seule de `openingHoursJson`/`servicesJson` (typés via
  `@angaly/types` `AtelierOpeningHours`, voir `docs/features/ateliers.md`) pour le calcul de
  disponibilité ; ce module n'écrit jamais dans `Atelier`.
- **`customers`** : associe `Appointment.customerId` si l'utilisateur est connecté ; reste
  fonctionnel pour un visiteur non connecté (champs `firstName`/`lastName`/`phone`/`email`
  saisis directement dans le formulaire, spec §33).
- **`notifications`** (Phase 3) : `create-appointment`/`confirm-appointment`/
  `cancel-appointment` déclenchent chacun une notification (spec §36) une fois le module
  livré ; en attendant, TODO explicite (pas d'envoi réel avant Phase 3).
- **Pages consommatrices** : `prendre-rendez-vous`, `confirmation-rendez-vous`,
  `reservation-essayage` (même module, `type = ESSAYAGE`).

## Points d'attention

`get-appointment-by-reference`/`cancel-appointment` sont accessibles sans authentification
via la seule connaissance de la `reference` (nécessaire pour un visiteur non connecté qui a
pris rendez-vous) : la `reference` doit donc être suffisamment peu devinable (ex. UUID/nanoid
inclus dans le format, pas une simple séquence `ANG-RDV-2026-00001` prévisible côté sécurité)
— voir spec §75 (protection des données personnelles). Documenter ce compromis
explicitement plutôt que de bloquer l'accès derrière un compte, ce qui casserait le parcours
visiteur voulu par la spec.

## Vérification

- [ ] `get-month-availability`/`get-day-slots` testés (jour complet, atelier fermé, créneau
      déjà pris)
- [ ] `create-appointment` testé (avec/sans `Customer` connecté, référence unique générée)
- [ ] `cancel-appointment`/`confirm-appointment` testés (transitions de statut valides et
      invalides)
- [ ] `appointments.controller.spec.ts` couvre les codes 200/201/404
- [ ] `docs/checklist-implementation.md` : `appointments` passé à ✅
