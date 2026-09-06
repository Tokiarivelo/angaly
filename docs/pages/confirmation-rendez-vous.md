# Page — `confirmation-rendez-vous`

**Statut : ⬜ À faire.** Phase 2 — Conversion.

## Objet

Page de confirmation/reçu affichée (et potentiellement liée depuis un email/WhatsApp) après
une réservation réussie sur `prendre-rendez-vous` : récapitulatif du rendez-vous, numéro de
réservation, et actions de gestion (ajouter au calendrier, modifier, annuler) — spec §35-36.

## Route(s)

`apps/web/src/app/(client)/rendez-vous/[reference]/confirmation/page.tsx` →
`/rendez-vous/:reference/confirmation`

Server Component (contenu figé au moment de la réservation, pas d'interactivité lourde) ;
les trois actions (ajouter au calendrier, modifier, annuler) sont des Client Components
isolés.

## Référence maquette

- Prompt Stitch : `stitch-prompts/15-confirmation-rendez-vous.md`
- Écran Stitch : **ANGALY — Confirmation de rendez-vous**
- Section spécification : §35-36 (`docs/specifications/ANGALY_Specifications_Completes.md`)

## Arborescence de composants attendue

```
apps/web/src/features/confirmation-rendez-vous/
  ui/
    ConfirmationRendezVousPage.tsx → carte centrale + panneau latéral optionnel
    SuccessBadge.tsx                → icône check dans anneau champagne, ton Success
    AppointmentRecapCard.tsx        → paires label/valeur : numéro, type, atelier, date, heure, couturière
    AtelierLocationSnippet.tsx      → vignette atelier + adresse + lien "Voir l'itinéraire"
    AppointmentActionsList.tsx      → Ajouter au calendrier / Modifier / Annuler
    DiscoverMoreSidePanel.tsx       → "En attendant votre rendez-vous" (créations, Journal), desktop only
  hooks/
    useAppointment.ts                → charge le rendez-vous par `reference` via react-query
    useAddToCalendar.ts               → génère un fichier .ics / lien calendrier
    useCancelAppointment.ts           → mutation d'annulation (avec confirmation)
  api/
    appointments.api.ts               → useAppointmentQuery, useCancelAppointmentMutation
  __tests__/
    useAppointment.test.ts
    useCancelAppointment.test.ts
    ConfirmationRendezVousPage.test.tsx
  index.ts
```

`ConfirmationRendezVousPage.tsx` et les composants `ui/` restent purement présentationnels ;
le chargement du rendez-vous et les actions vivent dans `hooks/`.

## Endpoints API consommés

| Endpoint | Module | Usage |
| --- | --- | --- |
| `GET /api/appointments/:reference` | `appointments` | Détail du rendez-vous pour le récapitulatif |
| `POST /api/appointments/:reference/cancel` | `appointments` | Annulation (transition vers `CANCELLED`) |
| `GET /api/ateliers/:id` | `ateliers` | Adresse/coordonnées de l'atelier pour la vignette |

> "Modifier le rendez-vous" renvoie vers `prendre-rendez-vous` pré-rempli avec la référence
> existante plutôt que d'exposer un endpoint `PATCH` dédié sur cette page (évite de dupliquer
> le formulaire de sélection de créneau).

## Modèles Prisma touchés

`Appointment` (lecture par `reference`, mise à jour de `status` sur annulation), `Atelier`
(adresse, coordonnées pour la vignette).

## Points d'attention

- **Header minimal** : uniquement le logo ANGALY centré, pas de navigation complète, pour
  garder le focus sur la confirmation — conformément au prompt Stitch.
- Le ton de la page doit rester "note personnelle chaleureuse de l'atelier", pas un
  template SaaS générique de confirmation — éviter toute animation de type confettis.
- "Annuler le rendez-vous" est affiché en ton plus sourd/proche de l'erreur mais **jamais**
  en couleur d'erreur pleine — cohérent avec la nuance du prompt Stitch
  ("shown in a more muted/error-adjacent tone").
- Une confirmation est également envoyée par email et WhatsApp (spec §36, canal WhatsApp
  "selon intégration disponible") — cette page reste la source de vérité consultable à tout
  moment via son URL stable `/rendez-vous/:reference/confirmation`.
- Le panneau latéral "En attendant votre rendez-vous" est optionnel/desktop only et ne doit
  jamais retarder l'affichage du récapitulatif principal (contenu secondaire, chargement non
  bloquant).
- Vérifier que l'accès à cette page est bien scellé par la `reference` (ou un token dérivé)
  et non par un identifiant interne séquentiel devinable, car la page peut être consultée
  sans authentification (lien email/WhatsApp).

## Checklist d'acceptation

- [ ] Reproduit fidèlement `stitch-prompts/15-confirmation-rendez-vous.md` (carte centrale, badge succès, récapitulatif, actions)
- [ ] Récapitulatif affiche numéro de réservation, type, atelier (avec adresse), date, heure, couturière assignée si applicable
- [ ] "Ajouter à mon calendrier" génère un événement exploitable (ics ou lien Google/Outlook)
- [ ] "Modifier le rendez-vous" renvoie vers `prendre-rendez-vous` avec le contexte pré-rempli
- [ ] "Annuler le rendez-vous" déclenche une confirmation puis met à jour le statut visible
- [ ] Accès possible sans compte via l'URL de référence, sans exposer d'autres rendez-vous
- [ ] Tests : `useAppointment.test.ts`, `useCancelAppointment.test.ts`, `ConfirmationRendezVousPage.test.tsx`
- [ ] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
