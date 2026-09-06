# Page — `home`

**Statut : ✅ Fait.** Phase 1 — Présence digitale.

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
| `GET /api/content/sections?page=accueil` | `content` | **Non implémenté (Phase 6)** — copie codée en dur dans `useHomeContent.ts` en attendant |
| `GET /api/testimonials?featured=true` | `reviews` | **Non implémenté (Phase 2)** — mocké via MSW (`src/lib/msw/handlers/home.handlers.ts`) |
| `GET /api/creations?isFeatured=true&limit=6` | `creations` | Réel — alimente la section "La Une" (le nom du paramètre est `isFeatured`, pas `featured` comme initialement supposé ici avant l'implémentation du module) |
| `GET /api/ateliers` | `ateliers` | Réel — alimente "Nos Ateliers" (3 premiers), **ajouté à l'implémentation** : non listé ici à l'origine (fiche écrite avant le module `ateliers`), câblé en vrai plutôt que de laisser un teaser statique |
| `GET /api/blog-posts?limit=4` | `blog` | Réel — alimente "Le Journal Angaly", même note que `ateliers` ci-dessus |
| `POST /api/newsletter/subscribe` | `notifications` (ou `customers` si compte requis) | **Non implémenté (Phase 2)** — mocké via MSW, formulaire fonctionnel (validation Zod, états succès/erreur) prêt à basculer sur l'API réelle |

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

- [x] Toutes les sections de `stitch-prompts/01-home.md` sont présentes (Hero, La Une, Maison,
      Catégories, Sur Mesure, Patron Premium, Témoignages, Ateliers, Journal, Newsletter) et
      fidèles à la palette ANGALY — pas de photographie réelle disponible (Phase 6/`content`
      pour l'upload média) : blocs dégradés navy/champagne/ivoire en attendant
- [ ] Hero en LCP < 2.5s (Lighthouse) — **non mesuré** : pas de vraie photographie/`next/image`
      tant que `content` (Phase 6) ne fournit pas d'image hero réelle
- [x] Carrousel témoignages navigable au clavier (boutons précédent/suivant/points) et par
      swipe mobile (testé : `TestimonialsCarousel.test.tsx`)
- [x] Formulaire newsletter : validation Zod, état de succès **et d'erreur** (visible, la
      requête réelle échoue en 404 tant que `notifications` n'existe pas), pas de rechargement
      de page (`handleSubmit` intercepte le submit)
- [x] `<title>`/meta description définis (spec §70)
- [x] Sélecteur de langue FR/MG fonctionnel dans le footer (Zustand persisté — ne traduit pas
      encore le contenu, voir `docs/pages/navigation-mobile.md`)
- [x] Tests : `useHomeContent.test.ts`, `useNewsletterForm.test.ts`, `NewsletterForm.test.tsx`,
      `TestimonialsCarousel.test.tsx`, `useFeaturedCreations.test.ts`, `useAteliersTeaser.test.ts`,
      `useJournalTeaser.test.ts`, `useTestimonials.test.ts`, `HomePage.test.tsx` — 24 tests,
      99.8%/90%/100%/99.8% de couverture (stmts/branches/fonctions/lignes)
- [x] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅

## Notes d'implémentation

- **`HomePage.tsx` est un Client Component**, pas Server Component comme envisagé plus haut :
  il appelle des hooks react-query (`useFeaturedCreations`, etc.), impossibles dans un Server
  Component. Simplification assumée pour Phase 1 — un passage SSR/hydratation
  (`dehydrate`/`HydrationBoundary`) pourrait être ajouté plus tard comme optimisation de
  performance, hors périmètre de cette implémentation.
- **`AteliersTeaser`/`JournalTeaser` sont câblés aux vraies API** `ateliers`/`blog` plutôt que
  d'être de simples teasers statiques — ces modules n'existaient pas quand cette fiche a été
  écrite ; les brancher en vrai est une amélioration délibérée par rapport au contrat
  d'origine.
- **`@angaly/types`** s'est enrichi de `CreationDto`, `AtelierDto`, `BlogPostDto`/
  `BlogPostDetailDto` (avec leurs DTOs enfants) — ces types n'existaient pas encore ; les DTOs
  backend correspondants (`CreationResponseDto`, `AtelierResponseDto`,
  `BlogPostResponseDto`/`BlogPostDetailResponseDto`) ont été rétrofités pour les `implements`,
  garantissant que front et back restent structurellement synchronisés (même schéma que
  `MediaDto`).
- **Composants partagés créés à cette occasion** (première page du site) : `Header`/`Footer`/
  `LanguageSwitcher` (`components/layout/`), `Button` (`components/ui/`, variantes
  default/secondary/premium/ghost), le store Zustand `useLocaleStore`
  (`stores/locale.store.ts`), la config MSW (`lib/msw/`), le helper de test react-query
  (`lib/test-utils.tsx`), et `lib/routes.ts` (chemins canoniques de toutes les pages, y
  compris celles pas encore construites). Réutilisés par toute page suivante — la nav
  mobile (`docs/pages/navigation-mobile.md`) les complètera (drawer, bottom bar, FAB
  WhatsApp) sans les reconstruire.
- Les liens de nav/footer pointent vers les routes réelles même quand la page cible n'existe
  pas encore (ex. `/sur-mesure`, `/pattern-studio`, `/prendre-rendez-vous`) — 404 attendu
  jusqu'à ce que ces pages soient traitées, conforme à la consigne de ne jamais laisser un
  lien mort/absent en prod.
- **Passage de fidélité (2026-09-07)** : la première implémentation avait été construite à
  partir de `stitch-prompts/01-home.md` seul, sans jamais relire l'écran Stitch réel — ce qui
  a introduit des écarts structurels réels (nav à 10 liens au lieu de 5, logo non centré,
  footer à 4 colonnes avec icônes sociales au lieu de 3, section "Univers" en grille statique
  au lieu d'un carrousel horizontal avec un 4ᵉ item "Sur Mesure" et non "Prêt-à-porter",
  bandeau "Pattern Studio" plein-écran au lieu d'une carte encadrée, etc.). Corrigé en
  récupérant le HTML généré réel via `agy` (StitchMCP `get_screen` sur l'écran
  `f4fa1f6a3d0241cd9d1c5e003cbc1c38`, `htmlCode.downloadUrl`) et en traduisant ses classes
  Tailwind 1:1 vers les tokens `angaly-*` existants (mapping exact : `primary`→`angaly-navy`,
  `primary.dark`→`angaly-navy-dark`, `primary.container`→`angaly-navy-blue`,
  `surface`→`angaly-ivory`, `surface.warm`→`angaly-warm-ivory`, `accent.champagne`→
  `angaly-champagne`, `accent.gold`→`angaly-gold`, `neutral.slate`→`angaly-slate`,
  `neutral.muted`→`angaly-warm-gray`). Voir `.claude/skills/new-page-from-stitch/SKILL.md` et
  `.cursor/rules/006-phase-workflow.mdc` — cette vérification via `agy` est désormais
  obligatoire pour toute écriture de JSX/CSS, pas seulement au premier scaffold.
- La section "La Une" (aperçu sur la home) n'a pas pu être vérifiée visuellement en local car
  la base de dev ne contient aucune création (`GET /api/creations` renvoie `data: []`) —
  écart d'environnement/seed déjà documenté (`packages/database/prisma/seed.ts` vs
  `apps/api/.env`), hors périmètre de ce correctif. Le JSX a été écrit pour reproduire
  exactement la grille asymétrique réelle (12 colonnes, 7/5, `h-[800px]`) ; à re-vérifier
  visuellement une fois la base seedée.
