# Page — `reservation-essayage`

**Statut : ⬜ À faire.** Phase 2 — Conversion.

## Objet

Alternative à l'achat immédiat (spec §13) : réserver un créneau d'essayage en atelier pour un
produit prêt-à-porter donné (taille, atelier, date, heure), sans engagement de paiement.
Accessible depuis `fiche-produit` via l'action "Réserver pour essayage".

## Route(s)

`apps/web/src/app/(client)/essayage/reserver/page.tsx` → `/essayage/reserver`
(+ `?productId=&variantId=` en query, pré-remplis depuis `fiche-produit` — voir point
d'attention sur le rattachement produit/rendez-vous).

Client Component dès la racine (créneaux dynamiques dépendants de la date sélectionnée, pas de
bénéfice SSR) — même justification que `prendre-rendez-vous`.

> Accessible sans compte existant, comme `prendre-rendez-vous`, mais routée dans `(client)`
> conformément au périmètre défini pour cette fiche.

## Référence maquette

- Prompt Stitch : `stitch-prompts/10-essayage-panier-checkout.md` (Écran A — Réservation pour essayage)
- Écran Stitch : **ANGALY — Réserver un essayage**
- Section spécification : §13 (`docs/specifications/ANGALY_Specifications_Completes.md`)

## Arborescence de composants attendue

```
apps/web/src/features/reservation-essayage/
  ui/
    ReservationEssayagePage.tsx  → carte centrale : résumé produit + formulaire
    ProductSummaryRow.tsx         → vignette, nom, référence du produit concerné
    SizeChipSelector.tsx          → sélection de taille (chips)
    AtelierSelect.tsx             → dropdown atelier (nom + ville, icône localisation)
    AvailabilityCalendar.tsx      → calendrier minimal navy/ivoire
    TimeSlotChips.tsx             → créneaux horaires, slots indisponibles grisés
    ReservationFooterActions.tsx  → Primary "Confirmer la réservation" / lien "Annuler"
  hooks/
    useProductContext.ts          → lit productId/variantId depuis l'URL, charge le résumé produit
    useAvailability.ts            → disponibilité (jours + créneaux) pour l'atelier/mois courant
    useEssayageForm.ts            → état taille/atelier/date/heure, validation Zod
    useCreateEssayageAppointment.ts → mutation de création (type `ESSAYAGE`) → redirige vers
                                       `confirmation-rendez-vous`
  api/
    appointments.api.ts           → useAvailabilityQuery, useCreateEssayageAppointmentMutation
    products.api.ts                → useProductSummaryQuery
  schemas/
    essayage-reservation.schema.ts → Zod (taille, atelier, date, heure)
  consts/
    queryKeys.ts
  __tests__/
    useEssayageForm.test.ts
    useCreateEssayageAppointment.test.ts
  index.ts
```

Toute logique (contexte produit, disponibilité, validation, soumission) vit dans `hooks/` ;
`ReservationEssayagePage.tsx` et les composants `ui/` ne contiennent que du JSX + appels de
hooks.

## Endpoints API consommés

| Endpoint | Module | Usage |
| --- | --- | --- |
| `GET /api/products/:id` | `products` | Résumé produit (vignette, nom, référence, tailles) pour le pré-remplissage |
| `GET /api/ateliers` | `ateliers` | Liste des ateliers pour le sélecteur |
| `GET /api/appointments/availability?atelierId=&month=` | `appointments` | Jours disponibles/complets du mois |
| `GET /api/appointments/availability/slots?atelierId=&date=` | `appointments` | Créneaux horaires du jour choisi |
| `POST /api/appointments` | `appointments` | Création du rendez-vous (`type = ESSAYAGE`, statut initial `PENDING`) |

## Modèles Prisma touchés

`Appointment` (`type = ESSAYAGE`, `atelierId`, `scheduledAt`, `status` par défaut `PENDING`,
coordonnées si pas de `Customer` authentifié), `Atelier`, `Product`/`ProductVariant` (lecture
seule, pour le résumé — voir point d'attention sur l'absence de relation directe).

## Points d'attention

- **Aucun rattachement structurel produit ↔ rendez-vous** : le modèle `Appointment` ne porte
  aucune relation vers `Product`/`ProductVariant` (ni colonne `productId`/`productVariantId`).
  Le produit et la taille choisis sur `fiche-produit` ne peuvent donc, en l'état du schéma,
  être conservés que dans le champ libre `message` (texte structuré, ex. "Robe Solène —
  Taille M — Réf. ROB-0012"), ou nécessitent une évolution de schéma à trancher avec le module
  `appointments` avant l'implémentation — ne jamais inventer un champ côté frontend pour
  contourner ce manque.
- Le calendrier/les créneaux (`AvailabilityCalendar`, `TimeSlotChips`, `useAvailability`)
  reproduisent la même logique que `prendre-rendez-vous` — envisager de factoriser ces éléments
  plutôt que de les dupliquer, à trancher à l'implémentation.
- L'écran de confirmation (Screen B du prompt Stitch) est déjà couvert par la page générique
  `confirmation-rendez-vous` (route `/rendez-vous/:reference/confirmation`, tout type de
  rendez-vous confondu) — ne pas dupliquer cette page ; s'assurer seulement que
  `AppointmentRecapCard` y affiche le contexte produit/taille s'il est présent dans `message`.
- Créneaux indisponibles affichés grisés et non sélectionnables, recalculés à chaque changement
  de date/atelier — jamais une liste statique.
- Une confirmation est également envoyée par email et éventuellement WhatsApp (spec §13),
  cohérent avec `confirmation-rendez-vous`.

## Checklist d'acceptation

- [ ] Reproduit fidèlement `stitch-prompts/10-*.md` Écran A (résumé produit, formulaire, créneaux)
- [ ] Pré-remplissage produit/taille fonctionnel lorsque la page est atteinte depuis `fiche-produit`
- [ ] Créneaux indisponibles grisés et non sélectionnables, dépendants atelier/date
- [ ] Soumission crée bien un `Appointment` (`type = ESSAYAGE`, statut `PENDING`) et redirige vers `confirmation-rendez-vous`
- [ ] Bouton "Annuler" ramène vers la fiche produit sans créer de rendez-vous
- [ ] Tests : `useEssayageForm.test.ts`, `useCreateEssayageAppointment.test.ts`
- [ ] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
