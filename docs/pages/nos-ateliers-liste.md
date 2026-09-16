# Page — `nos-ateliers-liste`

**Statut : ✅ Fait.** Phase 1 — Présence digitale.

## Objet

Vue d'ensemble de tous les ateliers physiques de la maison avec une carte (spec §37-38),
point d'entrée vers la prise de rendez-vous et le contact local.

## Route(s)

`apps/web/src/app/(public)/ateliers/page.tsx` → `/ateliers`

**`'use client'`** — comme `home`/`la-une`/`nos-creations-galerie`/`creation-detail`/
`collections-liste`/`collection-detail`, `NosAteliersListePage` appelle `useAteliersList()`
(react-query sur `GET /api/ateliers`), donc pas de Server Component pur malgré l'aspiration
initiale de cette fiche (déviation documentée, cohérente avec toutes les autres pages
Phase 1 à données dynamiques livrées cette session).

## Référence maquette

- Prompt Stitch : `stitch-prompts/19-nos-ateliers-liste.md`
- Écran Stitch : **ANGALY — Nos Ateliers (Workshops & Locations)**
- Section spécification : §37-38 (`docs/specifications/ANGALY_Specifications_Completes.md`)

## Arborescence de composants (livrée)

```
apps/web/src/features/nos-ateliers-liste/
  ui/
    NosAteliersListePage.tsx      → orchestre header + bannière + split carte/liste, JSX + hooks uniquement
    AteliersHeader.tsx             → titre/sous-titre réels (contenu — voir hooks/useAteliersListeContent.ts), pas de fil d'Ariane sur l'écran réel
    FeaturedAtelierBanner.tsx      → bannière 60vh, affichée sans condition (pas « optionnelle »), voir Points d'attention
    AteliersMapPanel.tsx            → 'use client', panneau carte avec sélecteur de mode (Google Maps interactif / Plan Éditorial)
    GoogleMapAteliersView.tsx       → carte interactive Google Maps via @vis.gl/react-google-maps avec AdvancedMarker, Pin & InfoWindow
    AteliersList.tsx                 → liste scrollable des AtelierListCard
    AtelierListCard.tsx               → photo, nom (+ « (Flagship) »), adresse, horaires, services, « Voir la fiche complète »/« Itinéraire »
  hooks/
    useAteliersList.ts               → react-query sur GET /api/ateliers, résout le flagship par slug
    useAteliersListeContent.ts        → header réel, GET /content/public/nos-ateliers-liste, repli codé en dur
    useAteliersMap.ts                 → état du pin actif/survolé, synchro carte ↔ liste
    useGoogleMapsConfig.ts            → détection de NEXT_PUBLIC_GOOGLE_MAPS_API_KEY et bascule de mode
  api/
    nos-ateliers-liste.api.ts          → useAteliersListQuery, useAteliersListeSectionsContentQuery
  consts/
    flagship.const.ts                   → FLAGSHIP_ATELIER_SLUG
    queryKeys.ts
  utils/
    summarizeOpeningHours.ts             → groupe les jours consécutifs aux horaires identiques (« Lun - Ven : 09h00 - 18h00 »)
    buildDirectionsUrl.ts                 → lien Google Maps depuis lat/long (repli sur l'adresse)
  __tests__/
    summarizeOpeningHours.test.ts, buildDirectionsUrl.test.ts, useAteliersList.test.ts,
    useAteliersListeContent.test.ts, useGoogleMapsConfig.test.ts, AtelierListCard.test.tsx,
    AteliersMapPanel.test.tsx, FeaturedAtelierBanner.test.tsx, NosAteliersListePage.test.tsx
  index.ts
```

Toute logique (fetch, synchro carte/liste, formatage horaires, lien itinéraire, configuration carte) vit dans
`hooks/`/`utils/` — les composants `ui/` ne contiennent que du JSX + appels de hooks/utils.

## Endpoints API consommés

| Endpoint | Module | Usage |
| --- | --- | --- |
| `GET /api/ateliers` | `ateliers` | Liste de tous les ateliers (adresse, horaires, coordonnées, services, médias) pour la carte et la liste |
| `GET /api/content/public/nos-ateliers-liste` | `content` | Texte du header (titre/sous-titre), `PUBLISHED`-only |

## Modèles Prisma touchés

`Atelier` (`name`, `address`, `city`, `phone`, `openingHoursJson`, `servicesJson`,
`latitude`, `longitude`), `Media` (via `AtelierMedia`), `PageSection`
(`page="nos-ateliers-liste"`, `sectionKey="header"` — texte du header). Le seed
(`packages/database/prisma/seed.ts`)
a été enrichi avec 4 ateliers complets à Madagascar :
1. **Maison Mère & Atelier Haute Couture (Flagship)** — Antananarivo (`antananarivo-centre`)
2. **Salon Privé & Atelier Sur Mesure Ivandry** — Antananarivo (`antananarivo-ivandry`)
3. **Atelier Broderie d'Art & Soie Sauvage** — Antsirabe (`antsirabe-soie`)
4. **Comptoir Côtier & Confection Maritime** — Toamasina (`toamasina-croisiere`)

Toutes les photos sont hébergées et servies via MinIO.

## Points d'attention

- **Header (titre + sous-titre) migré vers `PageSection` CMS** (session 2026-09-16, suite —
  neuvième tranche de `docs/phases/phase-6-admin-cms.md` item 4, après `home`/`a-propos`/
  `la-une`/`nos-creations-galerie`/`creation-detail`/`contact`/`collections-liste`/
  `collection-detail`) : `AteliersHeader` lit `GET /content/public/nos-ateliers-liste` via
  `useAteliersListeContent`, repli sur le littéral codé en dur si la section `header` est
  absente/`DRAFT` — voir `docs/features/content.md`.
- **Intégration Google Maps Platform** :
  - Conforme aux standards Google Maps Platform (`@vis.gl/react-google-maps`).
  - Zéro API dépréciée : utilisation exclusive d'`AdvancedMarkerElement` / `<AdvancedMarker>` et `<Pin>` (pas de `google.maps.Marker` déprécié).
  - Prop obligatoire `mapId="DEMO_MAP_ID"` et attribution `internalUsageAttributionIds={['gmp_git_agentskills_v1']}` sur `<Map>`.
  - Hauteur explicite `100%` pour éviter tout collapse de viewport (CF2).
  - Contrôle caméra (`MapCameraController`) synchronisant le survol des cartes avec un pan/zoom fluide (`map.panTo`) et ajustement automatique des bornes (`map.fitBounds`) pour afficher l'ensemble des ateliers de Madagascar.
  - Bascule de mode fluide : si `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` est configurée, l'utilisateur dispose d'un toggle pour basculer entre **Google Maps** et le **Plan Éditorial Maison** ; si la clé n'est pas encore configurée, le repli sur le Plan Éditorial stylisé CSS garantit zéro régression visuelle ou de test.
- **Bannière atelier principal** : l'écran réel la montre de façon inconditionnelle (`FeaturedAtelierBanner`).
- **Répétition du flagship dans la liste** : l'écran réel répète l'atelier flagship comme première carte de la liste (avec le suffixe « (Flagship) »).
- `openingHoursJson`/`servicesJson` restent des colonnes `Json` typées côté Prisma via les DTOs `AtelierOpeningHours`/`AtelierServices`.
- « Itinéraire » (`buildDirectionsUrl.ts`) construit un lien Google Maps pur front-end à partir de `latitude`/`longitude`.
- E2E Playwright automatisé dans `apps/web/e2e/ateliers/nos-ateliers-liste.spec.ts` avec captures d'écran desktop et mobile.

## Checklist d'acceptation

- [x] Layout split carte/liste (carte à gauche, liste à droite desktop ; carte au-dessus, liste dessous mobile) fidèle à l'écran réel
- [x] Survol d'un pin met en surbrillance la carte atelier correspondante (et inversement) — `useAteliersMap()`
- [x] Chaque carte atelier affiche photo, nom, adresse, horaires (résumés), services, bouton itinéraire + lien fiche complète
- [x] Intégration Google Maps Platform moderne avec `@vis.gl/react-google-maps`, `AdvancedMarkerElement`, `Pin`, `InfoWindow` et repli gracieux
- [x] 4 ateliers réels de Madagascar seedés en base avec photos MinIO, horaires, coordonnées GPS précises et services
- [x] `<title>`/meta description définis (spec §70/§70.2 SEO local)
- [x] Tests unitaires complets (26 tests passés dans `nos-ateliers-liste`) + E2E Playwright validé (desktop + mobile)
- [x] `docs/checklist-implementation.md` et `docs/mockup-reference.md` à jour

