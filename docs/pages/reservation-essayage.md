# Page — `reservation-essayage`

**Statut : ✅ Fait.** Phase 2 — Conversion.

## Objet

Alternative à l'achat immédiat (spec §13) : réserver un créneau d'essayage en atelier pour un
produit prêt-à-porter donné (taille, atelier, date, heure), sans engagement de paiement.
Accessible depuis `fiche-produit` via l'action "Réserver pour essayage".

## Route(s)

`apps/web/src/app/(public)/essayage/reserver/page.tsx` → `/essayage/reserver`
(+ `?productId=&size=` en query — voir déviation ci-dessous, ce n'est pas `variantId` comme
annoncé initialement).

Client Component dès la racine (créneaux dynamiques dépendants de la date sélectionnée, pas de
bénéfice SSR) — même justification que `prendre-rendez-vous`.

> **Déviation vérifiée à l'implémentation** : routée dans `(public)`, pas `(client)` comme
> initialement prévu — même raison que `prendre-rendez-vous`
> (`docs/pages/prendre-rendez-vous.md`) : `(client)/layout.tsx` exige une session
> authentifiée, incompatible avec "Accessible sans compte existant" ci-dessus.
> **Query params réels** : `fiche-produit` (déjà livrée, voir
> `apps/web/src/features/fiche-produit/ui/ProductActionsGroup.tsx`) envoie
> `?productId=<id>&size=<taille>` — pas `?productId=&variantId=` comme annoncé plus haut. Le
> contrat déjà expédié fait foi ; ce document est corrigé en conséquence plutôt que de
> modifier `fiche-produit` sans raison.

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
| `GET /api/products/:id` | `products` | **N'existe pas** (voir déviation ci-dessous) — mocké via MSW pour cette session |
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

### Déviations vérifiées via `agy`/StitchMCP (écran réel "ANGALY — Réserver un essayage")

- **`GET /api/products/:id` n'existe pas** — le controller `products` n'expose que
  `GET /api/products` (liste) et `GET /api/products/:slug` (voir
  `apps/api/src/products/presentation/controllers/products.controller.ts`), alors que
  `fiche-produit` transmet un `productId` réel (pas un slug). `IProductRepository.findById`
  existe déjà côté Domain (ajouté pour l'hydratation des favoris de `customers`) — l'exposer
  via une route `GET /api/products/id/:id` est un petit ajout backend bien délimité, mais
  **hors périmètre de cette passe frontend** (voir l'étape 4 du skill `new-page-from-stitch` :
  "scaffolder l'UI contre des données mockées/MSW... noter le manque dans la fiche de page").
  Le résumé produit est donc mocké via MSW (`apps/web/src/lib/msw/handlers/
  reservation-essayage.handlers.ts`) à la route que cet endpoint utiliserait une fois ajouté.
  **TODO backend** : ajouter `GET /api/products/id/:id` + `GetProductByIdUseCase` avant que
  cette page fonctionne en dehors des tests/du mode dev avec mocks.
- **Aucun champ de coordonnées (prénom/nom/téléphone/email) sur l'écran réel** — contrairement
  à `prendre-rendez-vous`, l'écran ne montre que Taille/Atelier/Date/Heure puis "Confirmer la
  réservation". Or `POST /api/appointments` exige `firstName`/`lastName`/`phone`/`email` sans
  condition (`docs/features/appointments.md`), et cette page doit fonctionner pour un visiteur
  non connecté (voir "Route(s)" ci-dessus). Une section "Vos coordonnées" (mêmes champs que
  `prendre-rendez-vous`) a donc été ajoutée avant le bouton de soumission — un cas où le
  contrat backend + le périmètre déclaré de la page l'emportent sur une maquette
  probablement incomplète, plutôt que de bloquer la fonctionnalité pour rester
  pixel-perfect.
- **Aucun lien "Annuler"** sur l'écran réel (contrairement à l'arborescence de composants
  prévue plus haut, qui en anticipait un dans `ReservationFooterActions`) — implémenté sans,
  conformément à l'écran réel ; un visiteur qui veut abandonner navigue simplement en arrière.
- **Pas de légende sous le calendrier** (contrairement à `prendre-rendez-vous`) — l'écran réel
  ne rend aucun bloc de légende ; `AvailabilityCalendar` de cette feature est une copie locale
  adaptée (sans légende), pas une réutilisation de celle de `prendre-rendez-vous`.
- **Créneaux horaires sans état "grisé/Complet"** — même contrainte technique que
  `prendre-rendez-vous` : `GET /api/appointments/availability/slots` ne retourne que les
  créneaux libres, donc aucun état désactivé n'est représentable côté frontend.
- **Calendrier/créneaux dupliqués depuis `prendre-rendez-vous`**, pas factorisés — décision
  tranchée en faveur de l'isolation feature-sliced déjà établie dans ce codebase (ex.
  `buildDirectionsUrl` dupliqué dans `atelier-detail`/`nos-ateliers-liste`/
  `confirmation-rendez-vous`), d'autant que le calendrier de cette page diverge déjà
  visuellement (pas de légende) de celui de `prendre-rendez-vous`.
- **"Guide des tailles"** : bouton présent (fidèle à l'écran réel) mais inerte — aucun contenu
  de guide des tailles n'existe ailleurs dans le codebase à réutiliser. **TODO** pour une
  itération future.

## Checklist d'acceptation

- [x] Reproduit fidèlement l'écran Stitch réel Écran A (résumé produit, formulaire, créneaux) — sauf déviations documentées ci-dessus
- [x] Pré-remplissage taille fonctionnel lorsque la page est atteinte depuis `fiche-produit` (`?productId=&size=`)
- [x] Créneaux indisponibles absents de la liste (jamais affichés, même contrainte que `prendre-rendez-vous`)
- [x] Soumission crée bien un `Appointment` (`type = ESSAYAGE`, statut `PENDING`) et redirige vers `/rendez-vous/:reference/confirmation`
- [x] Pas de bouton "Annuler" (fidèle à l'écran réel) — retour navigateur pour abandonner
- [x] Tests : `useProductContext.test.ts`, `useAvailability.test.ts`, `useEssayageForm.test.ts`, `useCreateEssayageAppointment.test.ts`, `ReservationEssayagePage.test.tsx`
- [x] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅

Suite complète : `pnpm --filter @angaly/web lint` / `typecheck` / `test -- reservation-essayage`
— tous verts (10 tests). Vérifié live via `pnpm --filter @angaly/web dev` + `curl` (route
`/essayage/reserver?productId=&size=` répond 200, contenu attendu présent, aucune erreur
serveur).
