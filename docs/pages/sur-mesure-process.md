# Page — `sur-mesure-process`

**Statut : ⬜ À faire.** Phase 2 — Conversion.

## Objet

Page éditoriale qui explique et "vend" le parcours sur-mesure en 8 étapes (de l'idée à la
livraison, spec §15), installe la confiance autour d'un processus artisanal très personnel,
et pousse vers les deux CTA de conversion : `demande-sur-mesure` et `prendre-rendez-vous`.
Contenu majoritairement statique/marketing, aucune logique métier propre.

## Route(s)

`apps/web/src/app/(client)/sur-mesure/page.tsx` → `/sur-mesure`

Server Component par défaut (contenu éditorial statique/CMS) ; seul l'accordéon FAQ est un
Client Component isolé.

> Note : cette page ne nécessite pas de compte pour être consultée (elle est purement
> éditoriale), mais elle est classée dans `(client)` avec le reste du parcours Phase 2 pour
> rester au plus près de ses CTA (`demande-sur-mesure`, `prendre-rendez-vous`) qui, eux,
> requièrent un compte — voir `docs/phases/phase-2-conversion.md`.

## Référence maquette

- Prompt Stitch : `stitch-prompts/11-sur-mesure-process.md`
- Écran Stitch : **ANGALY — L'Art du Sur Mesure**
- Section spécification : §15 (`docs/specifications/ANGALY_Specifications_Completes.md`)

## Arborescence de composants attendue

```
apps/web/src/features/sur-mesure-process/
  ui/
    SurMesureProcessPage.tsx    → orchestre les sections, importe uniquement des hooks + ui
    HeroSection.tsx             → photo cinématique + CTA "Créer ma tenue sur mesure" / "Prendre rendez-vous"
    ProcessTimeline.tsx         → timeline horizontale (verticale mobile) des 8 étapes
    ProcessStep.tsx             → un cercle numéroté + libellé + description
    WhyChooseSection.tsx        → 3 colonnes : Précision, Exclusivité, Accompagnement
    RealisationsGallery.tsx     → grille éditoriale de 4-6 réalisations sur mesure
    TestimonialBlock.tsx        → bloc témoignage fond navy
    FaqAccordion.tsx            → 'use client' (état d'ouverture vient de useFaqAccordion())
    ClosingCtaBand.tsx          → bandeau final, mêmes deux CTA que le hero
  hooks/
    useSurMesureContent.ts      → lit les PageSection (page="sur-mesure") via react-query
    useFaqAccordion.ts          → état d'ouverture des items FAQ
  api/
    sur-mesure.api.ts           → useSurMesureContentQuery
  consts/
    process-steps.const.ts      → les 8 étapes (libellé + description) par défaut
    queryKeys.ts
  __tests__/
    useSurMesureContent.test.ts
    SurMesureProcessPage.test.tsx
  index.ts
```

Toute logique (chargement de contenu, état de l'accordéon) vit dans `hooks/` —
`SurMesureProcessPage.tsx` et les sections ne contiennent que du JSX + appels de hooks.

## Endpoints API consommés

| Endpoint | Module | Usage |
| --- | --- | --- |
| `GET /api/content/sections?page=sur-mesure` | `content` | Textes/images éditables (hero, timeline, FAQ, témoignage) |
| `GET /api/creations?tag=sur-mesure&limit=6` | `creations` | Sélection de réalisations sur mesure pour la galerie |

## Modèles Prisma touchés

`PageSection` (lecture, `page = "sur-mesure"`), `Creation` (+ `Media` via relation, pour la
galerie de réalisations), `Testimonial`.

## Points d'attention

- Comme `home` en Phase 1, le module `content` n'existe pas encore quand cette page est
  traitée en Phase 2 avant Phase 6 : utiliser des valeurs par défaut codées en dur dans
  `useSurMesureContent.ts` (8 étapes, FAQ, témoignage) avec un TODO explicite pointant vers
  cette fiche, puis migrer vers l'API `content` une fois `docs/phases/phase-6-admin-cms.md`
  traitée — même stratégie que `docs/pages/home.md`.
- Les deux CTA ("Créer ma tenue sur mesure" → `demande-sur-mesure`, "Prendre rendez-vous" →
  `prendre-rendez-vous`) doivent apparaître à trois endroits (hero, bandeau final, sticky
  mobile) et pointer vers des routes réelles dès cette page traitée — l'ordre suggéré de
  `docs/phases/phase-2-conversion.md` place `quotes` après `appointments`, vérifier que
  `prendre-rendez-vous` existe déjà avant de lier `sur-mesure-process`.
- Rester fidèle à l'esprit "processus artisanal" : aucune icône ludique, aucun excès de doré
  (Antique Gold réservé aux accents très ponctuels) — voir la section AVOID du prompt Stitch.
- La FAQ (délais moyens, tarifs indicatifs, nombre d'essayages inclus, zones de livraison,
  modalités d'acompte) est un contenu piloté par `content` à terme — mêmes valeurs par
  défaut en dur en attendant Phase 6.

## Checklist d'acceptation

- [ ] Les 7 sections de `stitch-prompts/11-sur-mesure-process.md` sont présentes et fidèles à la palette ANGALY
- [ ] Timeline des 8 étapes conforme à spec §15.1, verticale sur mobile avec ligne de connexion
- [ ] Galerie de réalisations sur mesure affiche 4 à 6 pièces avec légende (type + courte histoire)
- [ ] Accordéon FAQ navigable au clavier, un seul item ouvert à la fois (ou multi, à trancher à l'implémentation)
- [ ] CTA "Créer ma tenue sur mesure" renvoie vers `demande-sur-mesure`, "Prendre rendez-vous" vers `prendre-rendez-vous`
- [ ] Bandeau CTA sticky mobile fonctionnel
- [ ] Tests : `useSurMesureContent.test.ts`, `SurMesureProcessPage.test.tsx`
- [ ] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
