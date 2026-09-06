# Page — `nos-ateliers-liste`

**Statut : ⬜ À faire.** Phase 1 — Présence digitale.

## Objet

Vue d'ensemble de tous les ateliers physiques de la maison avec une carte interactive
(spec §37-38), point d'entrée vers la prise de rendez-vous et le contact local.

## Route(s)

`apps/web/src/app/(public)/ateliers/page.tsx` → `/ateliers`

Server Component par défaut pour la liste (SEO local, spec §70.2) ; la carte interactive
et la synchronisation carte ↔ liste (pin survolé/sélectionné) sont des Client Components
isolés.

## Référence maquette

- Prompt Stitch : `stitch-prompts/19-nos-ateliers-liste.md`
- Écran Stitch : **ANGALY — Nos Ateliers (Workshops & Locations)**
- Section spécification : §37-38 (`docs/specifications/ANGALY_Specifications_Completes.md`)

## Arborescence de composants attendue

```
apps/web/src/features/nos-ateliers-liste/
  ui/
    NosAteliersListePage.tsx      → orchestre bannière + layout split carte/liste
    FeaturedAtelierBanner.tsx      → bannière atelier principal (optionnelle)
    AteliersMap.tsx                 → 'use client' carte interactive (état pin actif vient de useAteliersMap())
    AteliersList.tsx
    AtelierListCard.tsx              → photo, nom, adresse, horaires, services, « Voir l'itinéraire »/« Voir la fiche complète »
  hooks/
    useAteliersList.ts               → react-query sur GET /api/ateliers
    useAteliersMap.ts                 → état du pin actif/survolé, synchro carte ↔ liste
  api/
    nos-ateliers-liste.api.ts          → useAteliersListQuery
  consts/
    queryKeys.ts
  __tests__/
    useAteliersList.test.ts
    NosAteliersListePage.test.tsx
  index.ts
```

Toute logique (fetch, synchro carte/liste) vit dans `hooks/` — `NosAteliersListePage.tsx`
et les sections ne contiennent que du JSX + appels de hooks.

## Endpoints API consommés

| Endpoint | Module | Usage |
| --- | --- | --- |
| `GET /api/ateliers` | `ateliers` | Liste de tous les ateliers (adresse, horaires, coordonnées, services) pour la carte et la liste |

## Modèles Prisma touchés

`Atelier` (`name`, `address`, `city`, `phone`, `openingHoursJson`, `servicesJson`,
`latitude`, `longitude`), `Media` (via `AtelierMedia`).

## Points d'attention

- `openingHoursJson`/`servicesJson` sont des colonnes `Json` non typées côté Prisma (voir
  `docs/features/ateliers.md`) : le front doit consommer un DTO typé
  (`AtelierOpeningHours`/`AtelierServices` dans `@angaly/types`), jamais parser le JSON brut
  dans un composant `ui/`.
- Solution cartographique (spec §38) à choisir en respectant la contrainte de style « muted,
  navy/ivory tones » du prompt Stitch (éviter le rendu bleu vif par défaut de la plupart des
  fournisseurs) — documenter le choix technique (ex. MapLibre + style personnalisé) dans
  `docs/development.md` si une clé d'API/service externe est nécessaire (variable
  d'environnement, règle absolue #3).
- « Voir l'itinéraire » ouvre l'app de cartes native/un lien externe (Google Maps) construit
  à partir de `latitude`/`longitude` — aucune logique métier côté API, uniquement un lien
  construit côté front.
- Pas de pagination : le volume d'ateliers attendu est faible (voir
  `docs/features/ateliers.md`), lister tous les résultats d'un coup.
- Bannière « atelier principal » (optionnelle dans la maquette) : en l'absence de champ
  `isFlagship`/`isMain` sur `Atelier`, désigner l'atelier en dur par son `slug` dans une
  const (`consts/`) plutôt que d'ajouter un champ Prisma non demandé par la spec — à revoir
  si un vrai besoin de mise en avant configurable apparaît.

## Checklist d'acceptation

- [ ] Layout split carte/liste (carte à gauche, liste à droite desktop ; carte au-dessus, liste dessous mobile) fidèle à `stitch-prompts/19-nos-ateliers-liste.md`
- [ ] Clic sur un pin met en surbrillance la carte atelier correspondante (et inversement)
- [ ] Chaque carte atelier affiche photo, nom, adresse, horaires, services, bouton itinéraire + lien fiche complète
- [ ] Carte interactive stylée en tons navy/ivoire (pas de bleu Google Maps par défaut)
- [ ] `<title>`/meta description définis (spec §70/§70.2 SEO local)
- [ ] Tests : `useAteliersList.test.ts`, `NosAteliersListePage.test.tsx`
- [ ] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
