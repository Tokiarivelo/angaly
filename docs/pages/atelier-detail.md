# Page — `atelier-detail`

**Statut : ⬜ À faire.** Phase 1 — Présence digitale.

## Objet

Page dédiée à un atelier unique (adresse, horaires, services, galerie), utile aussi pour
le SEO local (spec §37, §70.2-70.3).

## Route(s)

`apps/web/src/app/(public)/ateliers/[slug]/page.tsx` → `/ateliers/:slug`

Server Component par défaut (contenu quasi entièrement lecture) ; la mini-carte avec un
seul pin et la barre d'actions sticky mobile sont des Client Components isolés.

## Référence maquette

- Prompt Stitch : `stitch-prompts/20-atelier-detail.md`
- Écran Stitch : **ANGALY — Atelier Antananarivo Centre (Detail)**
- Section spécification : §37 (`docs/specifications/ANGALY_Specifications_Completes.md`)

## Arborescence de composants attendue

```
apps/web/src/features/atelier-detail/
  ui/
    AtelierDetailPage.tsx         → orchestre galerie héro + panneau info + galerie ambiance + bloc SEO local
    AtelierHeroGallery.tsx         → grande photo + vignettes
    AtelierInfoPanel.tsx            → adresse, téléphone (click-to-call), horaires jour par jour, services + carte + actions
    AtelierOpeningHoursList.tsx      → rendu typé de openingHoursJson
    AtelierServicesList.tsx           → rendu typé de servicesJson
    AtelierMiniMap.tsx                 → 'use client' carte avec un seul pin
    AtelierAmbianceGallery.tsx          → grille éditoriale 4-6 photos
    AtelierTeamRow.tsx                   → cartes équipe (optionnel, voir Points d'attention)
    AtelierLocalSeoBlock.tsx              → paragraphe éditorial SEO local
    MobileStickyAppointmentBar.tsx         → 'use client' CTA rendez-vous sticky bas
  hooks/
    useAtelierDetail.ts                    → react-query sur GET /api/ateliers/:slug
  api/
    atelier-detail.api.ts                   → useAtelierDetailQuery
  types/
    atelier-detail.types.ts
  __tests__/
    useAtelierDetail.test.ts
    AtelierDetailPage.test.tsx
  index.ts
```

Toute logique (fetch) vit dans `hooks/` — `AtelierDetailPage.tsx` et les sections ne
contiennent que du JSX + appels de hooks.

## Endpoints API consommés

| Endpoint | Module | Usage |
| --- | --- | --- |
| `GET /api/ateliers/:slug` | `ateliers` | Fiche complète (adresse, horaires, services, médias, coordonnées) |

## Modèles Prisma touchés

`Atelier` (tous champs), `Media` (via `AtelierMedia` — galerie héro + galerie ambiance).

## Points d'attention

- Section 4 « Équipe de cet atelier » (optionnelle dans la maquette) n'a aucun support
  Prisma : pas de modèle « membre d'équipe » avec photo/rôle publiable. Hors périmètre
  Phase 1 — l'omettre tant qu'un modèle dédié (ou une extension de `PageSection`) n'est pas
  prévu ; ne pas détourner `User` (identité/auth interne) pour cet usage public.
- Horaires jour par jour : dériver l'affichage détaillé depuis `openingHoursJson` typé
  (`AtelierOpeningHours`, voir `docs/features/ateliers.md`), pas de nouveau champ Prisma.
- Bloc SEO local (Section 5) : contenu éditorial, à saisir en dur en Phase 1 (ou via un
  futur champ de `content`) — ne pas ajouter un champ Prisma dédié pour un simple
  paragraphe SEO.
- `Atelier.phone` est optionnel (`String?`) : prévoir un état « non renseigné » propre pour
  le lien `tel:` plutôt que d'afficher un lien vide.
- CTA « Prendre rendez-vous dans cet atelier » doit préremplir le sélecteur d'atelier de
  `prendre-rendez-vous` (Phase 2, via un paramètre `?atelierId=`) — lien câblé dès Phase 1
  même si la route cible dépend de Phase 2.

## Checklist d'acceptation

- [ ] Galerie héro + panneau info deux colonnes (horaires jour par jour, services, carte, actions) fidèles à `stitch-prompts/20-atelier-detail.md`
- [ ] Galerie « L'atelier en images » (4-6 photos) et bloc SEO local rendus
- [ ] Comportement mobile : galerie en carousel swipeable, CTA rendez-vous sticky bas
- [ ] `<title>`/meta description + données structurées locales (spec §70.2/§70.3) définis
- [ ] Tests : `useAtelierDetail.test.ts`, `AtelierDetailPage.test.tsx`
- [ ] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
