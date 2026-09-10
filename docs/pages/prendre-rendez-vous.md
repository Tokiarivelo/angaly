# Page — `prendre-rendez-vous`

**Statut : ✅ Fait.** Phase 2 — Conversion.

## Objet

CTA principal du site (spec §99) : formulaire court et progressif de prise de rendez-vous
(type de création, atelier, date, heure, coordonnées, message) couplé à un calendrier de
disponibilité (dates disponibles/complètes/fermées, spec §33-34). Le parcours complet doit
tenir sous la minute (spec §98, `docs/phases/phase-2-conversion.md`).

## Route(s)

`apps/web/src/app/(public)/prendre-rendez-vous/page.tsx` → `/prendre-rendez-vous`

Client Component dès la racine (calendrier interactif, créneaux dynamiques dépendants de la
date sélectionnée — pas de bénéfice SSR déterminant).

> **Déviation vérifiée à l'implémentation** : routée dans `(public)`, pas `(client)` comme
> initialement prévu ci-dessus. `apps/web/src/app/(client)/layout.tsx` exige une session
> authentifiée (`redirect('/connexion?...')` si `!session?.user`) — y router cette page
> casserait le parcours visiteur non connecté que la spec §33/§99 exige explicitement. Le
> groupe `(public)` fournit déjà `Header`/`Footer`/`MobileNavigationShell` (voir
> `apps/web/src/app/(public)/layout.tsx`), donc la feature n'a besoin de construire que le
> contenu `<main>`. Un utilisateur `CLIENT` connecté navigant depuis `(client)` atteint quand
> même cette page normalement (aucune redirection sortante) ; l'enrichissement `Customer` se
> fait déjà côté backend via le Bearer token optionnel (voir
> `docs/features/appointments.md`).

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

### Déviations vérifiées via `agy`/StitchMCP (écran réel "ANGALY — Prendre rendez-vous (Booking)")

- **Pas de filtre secondaire "Voir la disponibilité de : [Atelier / Couturière]"** —
  contrairement à ce que ce document anticipait plus haut, l'écran réel ne comporte qu'un
  simple `<select>` Atelier (2 options : Antananarivo, Paris) sans filtre par couturière. Non
  implémenté ici, conformément à la maquette réelle plutôt qu'à l'hypothèse initiale du
  document — l'assignation par couturière (`assignedToId`) reste un usage interne staff
  (`docs/features/appointments.md`).
- **Champ "3. Date" natif (`<input type="date">`) en plus du calendrier** — l'écran réel a
  les deux : un input date compact dans le formulaire ET le calendrier mensuel complet à
  droite. Implémenté avec le calendrier comme source de vérité pour la disponibilité (un
  clic sur un jour disponible met à jour le champ `date` du formulaire et surligne le jour
  sélectionné) ; l'input reste modifiable directement.
- **Créneaux horaires (`TimeSlotChips`) sans état "grisé/désactivé"** — l'écran réel montre
  une grille statique de 6 créneaux dont 2 visuellement désactivés (déjà pris). L'endpoint
  réel `GET /api/appointments/availability/slots` (voir `docs/features/appointments.md`)
  retourne uniquement les créneaux **libres** — il n'existe pas de liste "tous les créneaux
  possibles" côté API pour distinguer visuellement un créneau pris. Implémenté avec
  uniquement les créneaux retournés, tous sélectionnables ; si aucun créneau n'est libre, un
  message l'indique au lieu d'une grille grisée.
- **Redirection post-soumission** vers `/rendez-vous/:reference/confirmation`
  (`docs/pages/confirmation-rendez-vous.md`) — page pas encore implémentée à ce stade,
  prochaine étape de ce même palier de phase.

## Checklist d'acceptation

- [x] Reproduit fidèlement l'écran Stitch réel (deux colonnes desktop, calendrier avec légende Disponible/Complet/Fermé)
- [x] Sélection d'un type de création, d'un atelier et d'une date charge les créneaux horaires correspondants
- [x] Créneaux indisponibles absents de la liste (jamais affichés, voir déviation ci-dessus)
- [x] Soumission crée bien un `Appointment` au statut `PENDING` et redirige vers `/rendez-vous/:reference/confirmation`
- [x] Parcours réalisable rapidement (formulaire progressif court, pas d'étape superflue) — pas de mesure chronométrée automatisée (hors périmètre des tests unitaires de cette session)
- [x] Tests : `useAvailability.test.ts`, `useAppointmentForm.test.ts`, `useCreateAppointment.test.ts`, `PrendreRendezVousPage.test.tsx`
- [x] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅

Suite complète : `pnpm --filter @angaly/web lint` / `typecheck` / `test -- prendre-rendez-vous`
— tous verts (10 tests). Vérifié live via `pnpm --filter @angaly/web dev` + `curl` (route
`/prendre-rendez-vous` répond 200, contenu attendu présent, aucune erreur serveur).
