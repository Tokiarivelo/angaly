# Feature — `appointments`

**Statut : ✅ Fait.** Phase 2 — Conversion.

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
- **`notifications`** (Phase 3) : `confirm-appointment` émet `APPOINTMENT_CONFIRMED` — **câblé**
  (session 2026-09-15), mais seulement quand `Appointment.customerId` est renseigné (visiteur
  connecté) : un visiteur anonyme sans `Customer` lié n'a pas de `User` auquel rattacher une
  `Notification` in-app, la notification est alors silencieusement sautée (voir
  `docs/features/notifications.md` "Points d'attention"). `create-appointment`/
  `cancel-appointment` (`APPOINTMENT_REMINDER`/`APPOINTMENT_CANCELLED`) restent **TODO**.
- **Pages consommatrices** : `prendre-rendez-vous`, `confirmation-rendez-vous`,
  `reservation-essayage` (même module, `type = ESSAYAGE`).

## Points d'attention

`get-appointment-by-reference`/`cancel-appointment` sont accessibles sans authentification
via la seule connaissance de la `reference` (nécessaire pour un visiteur non connecté qui a
pris rendez-vous) : la `reference` doit donc être suffisamment peu devinable (ex. UUID/nanoid
inclus dans le format, pas une simple séquence `ANG-RDV-2026-00001` prévisible côté sécurité)
— voir spec §75 (protection des données personnelles). Documenter ce compromis
explicitement plutôt que de bloquer l'accès derrière un compte, ce qui casserait le parcours
visiteur voulu par la spec. En pratique, `generateAppointmentReference()` utilise
`randomBytes(6).toString('base64url')` (même pattern que `auth`'s `opaque-token.vo.ts`) —
format `ANG-RDV-{année}-{8 caractères base64url}`, non séquentiel et non devinable.

- **Granularité de créneau fixe** : `Appointment.durationMinutes` varie selon `type` (essayage
  court vs. consultation longue), mais `availability-calculator.service.ts` calcule la
  disponibilité avec une granularité fixe `DEFAULT_SLOT_MINUTES = 45` — simplification
  assumée pour ce MVP plutôt qu'un calcul par-type qui complexifierait `computeDayAvailability`
  sans réel besoin exprimé côté spec/maquette. À revisiter si un type nécessite un créneau
  significativement plus long que 45 min en usage réel.
- **`POST /api/appointments` avec authentification optionnelle** : la route reste publique
  (visiteur non connecté), mais un `Authorization: Bearer` valide, s'il est présent, enrichit
  automatiquement le rendez-vous avec le `Customer` associé. Implémenté via un helper
  `extractOptionalUserId()` qui lit et vérifie le token manuellement dans le controller
  (au lieu de `@UseGuards(JwtAuthGuard)`, qui rejetterait les visiteurs sans token) — retourne
  silencieusement `null` si le token est absent ou invalide plutôt que de lever une erreur.
- **`cancel`/`confirm` renvoient 200, pas 201** : NestJS `@Post()` répond `201 Created` par
  défaut, incorrect pour une transition d'état sur une ressource existante — les deux routes
  déclarent explicitement `@HttpCode(HttpStatus.OK)`.
- **Exports ajoutés en amont** : `AteliersModule` et `CustomersModule` n'exportaient rien
  avant ce module ; `ATELIER_REPOSITORY` et `CUSTOMER_REPOSITORY` sont maintenant exportés
  pour permettre l'injection croisée dans `AppointmentsModule` (résolution de `customerId`
  depuis `userId`, et validation de l'`atelierId`). `IAtelierRepository` a aussi gagné une
  méthode `findById` (absente jusqu'ici, seul `findBySlug` existait).

## Vérification

- [x] `get-month-availability`/`get-day-slots` testés (jour complet, atelier fermé, créneau
      déjà pris)
- [x] `create-appointment` testé (avec/sans `Customer` connecté, référence unique générée)
- [x] `cancel-appointment`/`confirm-appointment` testés (transitions de statut valides et
      invalides)
- [x] `appointments.controller.spec.ts` couvre les codes 200/201/404
- [x] `docs/checklist-implementation.md` : `appointments` passé à ✅

Suite complète : `pnpm --filter @angaly/api lint` / `typecheck` / `test` — tous verts (492
tests API, 0 erreur/warning lint, 0 erreur typecheck).
