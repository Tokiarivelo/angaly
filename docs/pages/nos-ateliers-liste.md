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
    AteliersHeader.tsx             → header centré (pas de fil d'Ariane sur l'écran réel)
    FeaturedAtelierBanner.tsx      → bannière 60vh, affichée sans condition (pas « optionnelle »), voir Points d'attention
    AteliersMapPanel.tsx            → 'use client', panneau carte stylé CSS + pins réels par atelier
    AteliersList.tsx                 → liste scrollable des AtelierListCard
    AtelierListCard.tsx               → photo, nom (+ « (Flagship) »), adresse, horaires, services, « Voir la fiche complète »/« Itinéraire »
  hooks/
    useAteliersList.ts               → react-query sur GET /api/ateliers, résout le flagship par slug
    useAteliersMap.ts                 → état du pin actif/survolé, synchro carte ↔ liste
  api/
    nos-ateliers-liste.api.ts          → useAteliersListQuery
  consts/
    flagship.const.ts                   → FLAGSHIP_ATELIER_SLUG
    queryKeys.ts
  utils/
    summarizeOpeningHours.ts             → groupe les jours consécutifs aux horaires identiques (« Lun - Ven : 09h00 - 18h00 »)
    buildDirectionsUrl.ts                 → lien Google Maps depuis lat/long (repli sur l'adresse)
  __tests__/
    summarizeOpeningHours.test.ts, buildDirectionsUrl.test.ts, useAteliersList.test.ts,
    AtelierListCard.test.tsx, AteliersMapPanel.test.tsx, FeaturedAtelierBanner.test.tsx,
    NosAteliersListePage.test.tsx
  index.ts
```

Toute logique (fetch, synchro carte/liste, formatage horaires, lien itinéraire) vit dans
`hooks/`/`utils/` — les composants `ui/` ne contiennent que du JSX + appels de hooks/utils.

## Endpoints API consommés

| Endpoint | Module | Usage |
| --- | --- | --- |
| `GET /api/ateliers` | `ateliers` | Liste de tous les ateliers (adresse, horaires, coordonnées, services, médias) pour la carte et la liste |

## Modèles Prisma touchés

`Atelier` (`name`, `address`, `city`, `phone`, `openingHoursJson`, `servicesJson`,
`latitude`, `longitude`), `Media` (via `AtelierMedia`). Le seed (`packages/database/prisma/seed.ts`)
a été corrigé : `address` était un placeholder `'À compléter'`, `latitude`/`longitude`
n'étaient pas renseignées (nécessaires pour « Itinéraire ») — remplacés par une adresse/
coordonnées réelles d'Ankorondrano, Antananarivo.

## Points d'attention

- **Fidélité vérifiée via `agy`/StitchMCP `get_screen`** (écran réel
  `0285a0cf439b45058dbe4e65b8001b7a`), pas seulement `stitch-prompts/19-nos-ateliers-liste.md`.
  **Découverte majeure** : l'écran réel n'a **aucune vraie intégration de carte interactive**
  (pas de MapLibre/Leaflet/Google Maps JS) — le prompt texte seul suggérait une carte réelle
  (« MapLibre + style personnalisé »), mais le design Stitch montre une simple **image de
  fond statique stylée** (`data-alt` : « a stylized, minimalist map interface... avoiding
  standard bright digital map colors ») avec 2 pins codés en dur en position absolue et des
  boutons +/- décoratifs non fonctionnels. `AteliersMapPanel.tsx` reproduit cette esthétique
  en CSS pur (dégradé de grille ivoire/gris chaud + un halo navy) plutôt que d'hotlinker
  l'asset Google interne de Stitch ou d'inventer une fausse image géographique — un pin réel
  par atelier de la base (position illustrative, pas de projection géographique réelle),
  avec survol synchronisé pin ↔ carte via `useAteliersMap()`. **Aucune dépendance de
  cartographie ajoutée, aucune clé d'API requise** — à revoir en Phase 2+ si un vrai besoin
  de carte géolocalisée apparaît (spec §38 le permettait déjà comme un choix technique
  ouvert, pas un mandat).
- **Bannière atelier principal** : l'écran réel la montre **de façon inconditionnelle**, pas
  « optionnelle » comme le supposait le plan initial de cette fiche (écrit avant la
  vérification `agy`) — `FeaturedAtelierBanner` ne s'affiche que si un atelier flagship
  existe (aucun atelier flagship en base → bannière absente), mais rien ne la rend
  intentionnellement facultative dans le design.
- **Répétition du flagship dans la liste** : contrairement à `collections-liste`
  (`useCollectionsList` exclut la collection vedette de la grille), l'écran réel **répète**
  l'atelier flagship comme première carte de la liste (avec le suffixe « (Flagship) ») —
  `useAteliersList()` ne filtre donc pas `ateliers`, à la différence du pattern
  collections-liste.
- `openingHoursJson`/`servicesJson` restent des colonnes `Json` non typées côté Prisma —
  consommées uniquement via les DTOs typés `AtelierOpeningHours`/`AtelierServices` de
  `@angaly/types`, jamais parsées brutes dans un composant `ui/`.
- « Itinéraire » (`buildDirectionsUrl.ts`) construit un lien Google Maps pur front-end à
  partir de `latitude`/`longitude` (repli sur une recherche d'adresse si absentes) — aucune
  logique côté API.
- Pas de pagination (volume d'ateliers attendu faible, voir `docs/features/ateliers.md`).
- « Voir la fiche complète » pointe vers `/ateliers/:slug` (page `atelier-detail`, pas
  encore livrée) — lien laissé actif plutôt que masqué, convention déjà suivie par
  `creation-detail`/`collection-detail` pour les routes Phase 1 restantes.

## Checklist d'acceptation

- [x] Layout split carte/liste (carte à gauche, liste à droite desktop ; carte au-dessus, liste dessous mobile) fidèle à l'écran réel
- [x] Survol d'un pin met en surbrillance la carte atelier correspondante (et inversement) — `useAteliersMap()`
- [x] Chaque carte atelier affiche photo, nom, adresse, horaires (résumés), services, bouton itinéraire + lien fiche complète
- [x] Panneau carte stylé en tons navy/ivoire (pas de bleu par défaut) — pas de vraie intégration de carte, fidèle à l'écran réel (voir Points d'attention)
- [x] `<title>`/meta description définis (spec §70/§70.2 SEO local)
- [x] Tests : `summarizeOpeningHours.test.ts`, `buildDirectionsUrl.test.ts`, `useAteliersList.test.ts`, `AtelierListCard.test.tsx`, `AteliersMapPanel.test.tsx`, `FeaturedAtelierBanner.test.tsx`, `NosAteliersListePage.test.tsx` — 22 tests
- [x] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
