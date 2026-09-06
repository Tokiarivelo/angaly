# Page — `home`

**Statut : ⬜ À faire.** Phase 1 — Présence digitale.

## Objet

Page d'accueil, vitrine principale de la maison ANGALY : doit installer immédiatement le
positionnement premium/éditorial et orienter vers les trois parcours principaux (Créations,
Prêt-à-porter, Sur Mesure/Pattern Studio).

## Route(s)

`apps/web/src/app/(public)/page.tsx` → `/`

Server Component par défaut (contenu majoritairement statique/CMS) ; seules les sections
interactives (carrousel témoignages, formulaire newsletter) sont des Client Components
isolés à l'intérieur du feature.

## Référence maquette

- Prompt Stitch : `stitch-prompts/01-home.md`
- Écran Stitch : **ANGALY — Maison de Couture Homepage**
- Section spécification : §5 (`docs/specifications/ANGALY_Specifications_Completes.md`)

## Arborescence de composants attendue

```
apps/web/src/features/home/
  ui/
    HomePage.tsx              → orchestre les sections, importe uniquement des hooks + ui
    HeroSection.tsx
    CategoriesSection.tsx
    SurMesureTeaser.tsx
    PatternStudioTeaser.tsx
    TestimonialsCarousel.tsx  → 'use client' (état du slide vient de useTestimonials())
    AteliersTeaser.tsx
    JournalTeaser.tsx
    NewsletterForm.tsx        → 'use client' (soumission vient de useNewsletterForm())
  hooks/
    useHomeContent.ts         → lit les PageSection (page="accueil") via react-query
    useTestimonials.ts        → état du carrousel (index courant, autoplay) + données
    useNewsletterForm.ts      → react-hook-form + Zod + mutation
  api/
    home.api.ts                → useHomeContentQuery, useTestimonialsQuery
  schemas/
    newsletter.schema.ts
  consts/
    queryKeys.ts
  __tests__/
    useHomeContent.test.ts
    HomePage.test.tsx
  index.ts
```

Toute logique (fetch, état du carrousel, validation du formulaire) vit dans `hooks/` —
`HomePage.tsx` et les sections ne contiennent que du JSX + appels de hooks, conformément à
`.cursor/rules/002-nextjs-features.mdc`.

## Endpoints API consommés

| Endpoint | Module | Usage |
| --- | --- | --- |
| `GET /api/content/sections?page=accueil` | `content` | Textes/images éditables de chaque section |
| `GET /api/testimonials?featured=true` | `reviews` | Témoignages mis en avant |
| `GET /api/creations?featured=true&limit=6` | `creations` | Sélection de créations vedettes |
| `POST /api/newsletter/subscribe` | `notifications` (ou `customers` si compte requis) | Inscription newsletter |

## Modèles Prisma touchés

`PageSection` (lecture, `page = "accueil"`), `Testimonial`, `Creation` (+ `Media` via
relation), `Category`.

## Points d'attention

- Le contenu de cette page est piloté par `PageSection`/Phase 6 — en Phase 1, avant que le
  module `content` existe, utiliser des valeurs par défaut codées en dur dans le hook
  `useHomeContent.ts` avec un TODO explicite pointant vers cette fiche, puis migrer vers
  l'API `content` une fois la Phase 6 traitée (voir `docs/phases/phase-6-admin-cms.md`).
- Image hero en LCP : utiliser `next/image` avec `priority`, format servi depuis MinIO.
- CTA "Prendre rendez-vous" du header doit renvoyer vers `prendre-rendez-vous` (Phase 2) —
  lien câblé dès Phase 1 même si la page cible n'existe pas encore (feature flag ou route
  planifiée, ne pas laisser un lien mort en prod).

## Checklist d'acceptation

- [ ] Toutes les sections de `stitch-prompts/01-home.md` sont présentes et fidèles à la palette ANGALY
- [ ] Hero en LCP < 2.5s (Lighthouse), image optimisée
- [ ] Carrousel témoignages navigable au clavier et par swipe mobile
- [ ] Formulaire newsletter : validation Zod, état de succès/erreur, pas de rechargement de page
- [ ] `<title>`/meta description définis (spec §70)
- [ ] Sélecteur de langue FR/MG fonctionnel dans le footer
- [ ] Tests : `useHomeContent.test.ts`, `useNewsletterForm.test.ts`, `HomePage.test.tsx` (rendu + a11y de base)
- [ ] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
