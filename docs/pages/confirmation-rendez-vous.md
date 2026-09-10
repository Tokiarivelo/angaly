# Page — `confirmation-rendez-vous`

**Statut : ✅ Fait.** Phase 2 — Conversion.

## Objet

Page de confirmation/reçu affichée (et potentiellement liée depuis un email/WhatsApp) après
une réservation réussie sur `prendre-rendez-vous` : récapitulatif du rendez-vous, numéro de
réservation, et actions de gestion (ajouter au calendrier, modifier, annuler) — spec §35-36.

## Route(s)

`apps/web/src/app/(auth)/rendez-vous/[reference]/confirmation/page.tsx` →
`/rendez-vous/:reference/confirmation`

> **Déviation vérifiée à l'implémentation** : routée dans `(auth)`, pas `(client)` comme
> initialement prévu ci-dessus — même raison que `prendre-rendez-vous`
> (`docs/pages/prendre-rendez-vous.md`) : `(client)/layout.tsx` exige une session
> authentifiée, ce qui casserait l'accès "sans authentification (lien email/WhatsApp)" exigé
> plus bas dans ce document. `(auth)/layout.tsx` est un simple passthrough (pas de session
> requise, pas de Header/Footer imposé) — un choix pragmatique plutôt que la création d'un
> nouveau groupe de routes dédié pour cette seule page.

Page composée comme Client Component (chargement du rendez-vous via react-query,
actions interactives) plutôt que Server Component — l'ensemble reste correct côté données
(le rendez-vous est chargé au premier rendu, pas de contenu obsolète), et évite de scinder
la page en Server+Client wrappers pour un gain marginal ici.

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
| `GET /api/ateliers` | `ateliers` | Liste complète (pas de `GET /api/ateliers/:id` — voir déviation ci-dessous), résolution de l'atelier par `atelierId` côté client |

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
  sans authentification (lien email/WhatsApp). Assuré par le backend
  (`docs/features/appointments.md` : `reference` générée via `randomBytes(6)`, non
  séquentielle).

### Déviations vérifiées via `agy`/StitchMCP (écran réel "ANGALY — Confirmation de rendez-vous")

- **Footer réutilisé, pas recopié** : l'écran réel affiche un footer en anglais
  ("Privacy Policy", "Terms of Service"…) qui ne correspond à aucune autre page du site
  (toutes les autres maquettes/pages ANGALY sont en français) — traité comme un artefact du
  générateur de maquette plutôt qu'un contenu voulu. La page réutilise le vrai composant
  partagé `@/components/layout/Footer` (déjà localisé en français) au lieu de dupliquer ce
  texte anglais.
- **Pas de `GET /api/ateliers/:id`** — le controller `ateliers` n'expose que
  `GET /api/ateliers` et `GET /api/ateliers/:slug` (voir
  `apps/api/src/ateliers/presentation/controllers/ateliers.controller.ts`), aucune route par
  `id`. La vignette atelier charge la liste complète (faible volume, même hypothèse que
  `nos-ateliers-liste`/`prendre-rendez-vous`) et résout l'atelier par `atelierId` côté client.
- **"Modifier" sans pré-remplissage** : renvoie vers `/prendre-rendez-vous` mais sans
  pré-remplir le formulaire avec la référence existante — `prendre-rendez-vous` n'accepte pas
  encore de paramètre de pré-remplissage (hors périmètre de son propre document de page).
  **TODO explicite** pour une itération future plutôt qu'une prise en charge partielle/bricolée
  maintenant.
- **"Annuler" en confirmation inline**, pas de `window.confirm()` natif — cohérent avec le
  ton "note personnelle chaleureuse" du prompt Stitch (pas de dialog navigateur générique) :
  le clic remplace la ligne d'actions par un message + deux liens ("Oui, annuler" /
  "Non, garder mon rendez-vous").
- **"Couturière"** n'apparaît dans le récapitulatif que si `assignedToId` est renseigné (le
  staff n'a pas encore confirmé/assigné sinon) — l'écran réel montre une valeur fixe
  ("Mme. Fanja") pour la démo, mais rien dans le schéma ne permet d'afficher un nom de
  couturière sans une jointure `User` supplémentaire côté `AppointmentResponseDto` (hors
  périmètre du module `appointments` tel que livré) ; affiche `Assignée` en attendant.

## Checklist d'acceptation

- [x] Reproduit fidèlement l'écran Stitch réel (carte centrale, badge succès, récapitulatif, actions) — sauf déviations documentées ci-dessus
- [x] Récapitulatif affiche numéro de réservation, type, atelier (avec adresse), date, heure, couturière assignée si applicable
- [x] "Ajouter à mon calendrier" génère un événement exploitable (fichier `.ics` téléchargé)
- [x] "Modifier le rendez-vous" renvoie vers `prendre-rendez-vous` (pré-remplissage en TODO, voir déviation)
- [x] "Annuler le rendez-vous" déclenche une confirmation puis met à jour le statut visible
- [x] Accès possible sans compte via l'URL de référence, sans exposer d'autres rendez-vous
- [x] Tests : `useAppointment.test.ts`, `useCancelAppointment.test.ts`, `useAddToCalendar.test.ts`, `buildIcsContent.test.ts`, `formatAppointmentDateTime.test.ts`, `ConfirmationRendezVousPage.test.tsx`
- [x] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅

Suite complète : `pnpm --filter @angaly/web lint` / `typecheck` / `test -- confirmation-rendez-vous`
— tous verts (12 tests). Vérifié live via `pnpm --filter @angaly/web dev` + `curl` (route
`/rendez-vous/:reference/confirmation` répond 200, header minimal + état de chargement
présents, aucune erreur serveur).
