# Page — `prendre-rendez-vous`

**Statut : ⬜ À faire.** Phase 2 — Conversion.

## Objet

CTA principal du site (spec §99) : formulaire court et progressif de prise de rendez-vous
(type de création, atelier, date, heure, coordonnées, message) couplé à un calendrier de
disponibilité (dates disponibles/complètes/fermées, spec §33-34). Le parcours complet doit
tenir sous la minute (spec §98, `docs/phases/phase-2-conversion.md`).

## Route(s)

`apps/web/src/app/(client)/prendre-rendez-vous/page.tsx` → `/prendre-rendez-vous`

Client Component dès la racine (calendrier interactif, créneaux dynamiques dépendants de la
date sélectionnée — pas de bénéfice SSR déterminant).

> Accessible sans compte existant (les champs prénom/nom/téléphone/email suffisent, comme
> pour un visiteur), mais routée dans `(client)` conformément au périmètre Phase 2 défini
> dans `docs/mockup-reference.md`/`docs/checklist-implementation.md`.

## Référence maquette

- Prompt Stitch : `stitch-prompts/14-prendre-rendez-vous.md`
- Écran Stitch : **ANGALY — Prendre rendez-vous (Booking)**
- Section spécification : §33-34 (`docs/specifications/ANGALY_Specifications_Completes.md`)

## Arborescence de composants attendue

```
apps/web/src/features/prendre-rendez-vous/
  ui/
    PrendreRendezVousPage.tsx   → layout deux colonnes (formulaire + calendrier), sticky au scroll
    AppointmentTypeChips.tsx    → chips type de création (Robe de mariée, Costume, Retouche...)
    AtelierSelect.tsx           → dropdown atelier (nom + ville, icône localisation)
    AvailabilityCalendar.tsx    → calendrier mensuel (disponible/complet/fermé/sélectionné)
    TimeSlotChips.tsx           → créneaux horaires générés depuis la disponibilité du jour choisi
    ContactFieldsGroup.tsx      → prénom, nom, téléphone, email
    AppointmentFooterBar.tsx    → bouton sticky "Confirmer le rendez-vous"
  hooks/
    useAvailability.ts          → charge la disponibilité (jours + créneaux) pour l'atelier/mois courant
    useAppointmentForm.ts       → état du formulaire, validation Zod, activation du bouton de confirmation
    useCreateAppointment.ts     → mutation de création → redirige vers `confirmation-rendez-vous`
  api/
    appointments.api.ts         → useAvailabilityQuery, useCreateAppointmentMutation
  schemas/
    appointment.schema.ts       → Zod (type, atelier, date, heure, prénom, nom, téléphone, email, message optionnel)
  consts/
    appointment-types.const.ts  → les 7 types (`AppointmentType`)
  __tests__/
    useAvailability.test.ts
    useAppointmentForm.test.ts
    useCreateAppointment.test.ts
  index.ts
```

Toute logique (chargement de disponibilité, état du calendrier, validation, soumission) vit
dans `hooks/` ; `PrendreRendezVousPage.tsx` et les composants `ui/` ne contiennent que du JSX
+ appels de hooks.

## Endpoints API consommés

| Endpoint | Module | Usage |
| --- | --- | --- |
| `GET /api/ateliers` | `ateliers` | Liste des ateliers pour le sélecteur |
| `GET /api/appointments/availability?atelierId=&month=` | `appointments` | Jours disponibles/complets/fermés du mois |
| `GET /api/appointments/availability/slots?atelierId=&date=` | `appointments` | Créneaux horaires du jour sélectionné |
| `POST /api/appointments` | `appointments` | Création du rendez-vous (statut initial `PENDING`) |

## Modèles Prisma touchés

`Appointment` (`type` — enum `AppointmentType`, `atelierId`, `scheduledAt`,
`durationMinutes`, `status` par défaut `PENDING`, coordonnées si pas de `Customer`
authentifié), `Atelier` (liste + `openingHoursJson` pour dériver les jours fermés).

## Points d'attention

- **CTA principal du site** (spec §99) : ce parcours doit rester sous la minute — pas de
  champ superflu, pas d'étape supplémentaire non prévue par le prompt Stitch.
- Le calendrier distingue trois états de jour (disponible avec pastille champagne, complet en
  grisé/opacité réduite, fermé avec motif diagonal/gris muté) — ne pas les confondre
  visuellement, c'est l'information la plus consultée de la page.
- Les créneaux horaires (`TimeSlotChips`) sont **dérivés dynamiquement** de la date
  sélectionnée et de l'atelier — recalculer à chaque changement de l'un ou l'autre, jamais
  une liste statique.
- Si plusieurs ateliers/couturières existent (spec §34), prévoir dès l'implémentation un
  filtre secondaire "Voir la disponibilité de : [Atelier / Couturière]" au-dessus du
  calendrier, même si l'assignation par couturière n'est pas encore active en Phase 2
  (`Appointment.assignedToId` existe déjà dans le schéma).
- La création d'un rendez-vous sans compte doit tout de même permettre un rattachement
  ultérieur à un `Customer` si l'email correspond à un compte existant — coordonner avec
  `docs/features/auth.md`/`docs/features/customers.md` (non traités ici) au moment de
  l'implémentation du module `appointments`.
- Mobile : le calendrier devient un widget compact extensible au-dessus des créneaux, la
  barre "Confirmer le rendez-vous" reste sticky en bas dès que les champs requis sont remplis.

## Checklist d'acceptation

- [ ] Reproduit fidèlement `stitch-prompts/14-prendre-rendez-vous.md` (deux colonnes desktop, calendrier avec légende)
- [ ] Sélection d'un type de création, d'un atelier et d'une date charge les créneaux horaires correspondants
- [ ] Créneaux indisponibles affichés grisés et non sélectionnables
- [ ] Soumission crée bien un `Appointment` au statut `PENDING` et redirige vers `confirmation-rendez-vous`
- [ ] Parcours complet réalisable en moins d'une minute (mesure manuelle ou test e2e chronométré)
- [ ] Tests : `useAvailability.test.ts`, `useAppointmentForm.test.ts`, `useCreateAppointment.test.ts`
- [ ] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
