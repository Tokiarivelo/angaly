# Page — `atelier-detail`

**Statut : ✅ Fait.** Phase 1 — Présence digitale.

## Objet

Page dédiée à un atelier unique (adresse, horaires, services, galerie), utile aussi pour
le SEO local (spec §37, §70.2-70.3).

## Route(s)

`apps/web/src/app/(public)/ateliers/[slug]/page.tsx` → `/ateliers/:slug`

**`'use client'`** — comme toutes les pages Phase 1 à données dynamiques livrées cette
session, `AtelierDetailPage` appelle `useAtelierDetail(slug)` (react-query sur
`GET /api/ateliers/:slug`), donc pas de Server Component pur pour le corps de la page.
`generateMetadata` reste côté Server Component de la route (même pattern que
`creations/[slug]`/`collections/[slug]`) : un fetch direct via `apiClient` avant le rendu.

## Référence maquette

- Prompt Stitch : `stitch-prompts/20-atelier-detail.md`
- Écran Stitch : **ANGALY — Atelier Antananarivo Centre (Detail)**
- Section spécification : §37 (`docs/specifications/ANGALY_Specifications_Completes.md`)

## Arborescence de composants (livrée)

```
apps/web/src/features/atelier-detail/
  ui/
    AtelierDetailPage.tsx         → orchestre fil d'Ariane + galerie héro + panneau info + galerie ambiance + bloc SEO local
    AtelierHeroGallery.tsx         → grande photo + 2 tuiles (photo secondaire + tuile décorative fixe « L'art de la précision »)
    AtelierInfoPanel.tsx            → adresse, téléphone (click-to-call), horaires, services, mini-carte, actions
    AtelierOpeningHoursList.tsx      → rendu typé jour par jour de openingHours (« Fermé » explicite)
    AtelierServicesList.tsx           → checklist 2 colonnes, dernier élément seul en pleine largeur
    AtelierMiniMap.tsx                 → panneau carte statique stylé CSS + un seul pin centré (pas de vraie carte, voir Points d'attention)
    AtelierAmbianceGallery.tsx          → grille 4-6 tuiles (« L'atelier en images »), photos réelles + tuile citation fixe
    AtelierLocalSeoBlock.tsx             → paragraphe éditorial SEO local templaté avec city/name réels (élision « d' » gérée)
  hooks/
    useAtelierDetail.ts                  → react-query sur GET /api/ateliers/:slug
  api/
    atelier-detail.api.ts                 → useAtelierDetailQuery
  utils/
    buildOpeningHoursSchedule.ts           → groupe les jours consécutifs, garde « Fermé » explicite (≠ résumé compact de nos-ateliers-liste)
    buildDirectionsUrl.ts                   → lien Google Maps depuis lat/long (repli adresse) — copie feature-locale, pas d'import cross-feature
  __tests__/
    buildOpeningHoursSchedule.test.ts, buildDirectionsUrl.test.ts, useAtelierDetail.test.ts,
    AtelierServicesList.test.tsx, AtelierOpeningHoursList.test.tsx, AtelierMiniMap.test.tsx,
    AtelierHeroGallery.test.tsx, AtelierAmbianceGallery.test.tsx, AtelierInfoPanel.test.tsx,
    AtelierLocalSeoBlock.test.tsx, AtelierDetailPage.test.tsx
  index.ts
```

**Pas de `AtelierTeamRow.tsx`/section « Nos Artisans »** — voir Points d'attention.
**Pas de `MobileStickyAppointmentBar.tsx`** — voir Points d'attention. Pas de
`types/atelier-detail.types.ts` : chaque composant consomme directement `AtelierDto`
(comme `creation-detail`/`collection-detail`), aucun type local n'était nécessaire.

## Endpoints API consommés

| Endpoint | Module | Usage |
| --- | --- | --- |
| `GET /api/ateliers/:slug` | `ateliers` | Fiche complète (adresse, horaires, services, médias, coordonnées) |

## Modèles Prisma touchés

`Atelier` (tous champs), `Media` (via `AtelierMedia` — galerie héro + galerie ambiance,
même relation, cyclée sur les tuiles réelles disponibles). Le seed a été enrichi de 3
nouvelles photos d'atelier (bobines de fil, détail de broderie, mains d'une couturière) —
l'unique photo précédente ne suffisait pas pour peupler les 6 emplacements photo réels de
cette page (2 en héro + 4 en galerie ambiance) sans dupliquer la même image côte à côte.

## Points d'attention

- **Fidélité vérifiée via `agy`/StitchMCP `get_screen`** (écran réel
  `1942a02ebcdf4602bbb913a464048643`), pas seulement `stitch-prompts/20-atelier-detail.md`.
- **Section « Nos Artisans » (équipe) omise** : l'écran réel montre 3 portraits nommés
  (Mme. Fanja, M. Rado, Mlle. Hary) avec rôle — mais aucun modèle Prisma ne supporte un
  « membre d'équipe » publiable (photo/rôle), exactement le cas anticipé par le plan initial
  de cette fiche. Omise plutôt qu'inventée, même pattern que la section « Valeurs » omise
  d'`a-propos`.
- **Pas de `MobileStickyAppointmentBar.tsx`** : le rendu Stitch réel récupéré est un rendu
  desktop unique, sans barre sticky mobile ni carrousel swipeable visibles dans le HTML —
  contrairement à l'aspiration initiale du plan de cette fiche. Ce pattern mobile global
  (drawer, bottom bar, FAB) relève de la page dédiée `navigation-mobile` (non livrée), pas
  d'une page individuelle — à revoir une fois cette page construite plutôt que d'inventer un
  composant sticky isolé sans référence visuelle.
- **Carte** : même constat que `docs/pages/nos-ateliers-liste.md` — pas de vraie
  intégration de carte (MapLibre/Leaflet/Google Maps JS), un panneau CSS statique stylé
  avec un seul pin centré reproduit l'esthétique réelle. Aucune dépendance ajoutée.
- **Horaires jour par jour** (`buildOpeningHoursSchedule.ts`) : contrairement au résumé
  compact de `nos-ateliers-liste` (jours abrégés, jours fermés omis), l'écran détail montre
  les 7 jours avec noms complets et un « Fermé » explicite pour Dimanche — implémentation
  volontairement séparée (feature-sliced), pas un import cross-feature du même util.
- `Atelier.phone` optionnel : la ligne téléphone est simplement omise (pas de lien `tel:`
  vide) quand `phone` est `null`.
- Bloc SEO local : paragraphe éditorial en dur (aucun champ Prisma dédié pour un simple
  paragraphe, cohérent avec la spec), mais templaté avec `atelier.city`/`atelier.name`
  réels plutôt que de coder en dur « Antananarivo » comme si cela valait pour tout futur
  atelier — élision française (« de » → « d' ») gérée pour les villes commençant par une
  voyelle.
- CTA « Prendre rendez-vous dans cet atelier » pointe vers
  `/prendre-rendez-vous?atelierId=<id>` (route Phase 2, pas encore livrée) — lien câblé dès
  Phase 1, même convention que `creation-detail`/`collection-detail`/`nos-ateliers-liste`
  pour les routes restantes.

## Checklist d'acceptation

- [x] Galerie héro + panneau info deux colonnes (horaires jour par jour, services, carte, actions) fidèles à l'écran réel
- [x] Galerie « L'atelier en images » (photos réelles cyclées) et bloc SEO local rendus
- [x] Comportement mobile : grilles responsives standard (pas de carrousel/sticky bar — absents de l'écran réel, voir Points d'attention)
- [x] `<title>`/meta description définis via `generateMetadata` (spec §70.2/§70.3 SEO local)
- [x] Tests : 11 fichiers, 29 tests (100 % de couverture sur la feature)
- [x] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
