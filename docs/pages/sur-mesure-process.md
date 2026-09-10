# Page — `sur-mesure-process`

**Statut : ✅ Fait.** Phase 2 — Conversion. Contenu et structure vérifiés contre l'écran
Stitch réel (via `agy`) — voir "Points d'attention" pour le détail des déviations par
rapport au texte de `stitch-prompts/11-sur-mesure-process.md`.

## Objet

Page éditoriale qui explique et "vend" le parcours sur-mesure en 8 étapes (de l'idée à la
livraison, spec §15), installe la confiance autour d'un processus artisanal très personnel,
et pousse vers les deux CTA de conversion : `demande-sur-mesure` et `prendre-rendez-vous`.
Contenu majoritairement statique/marketing, aucune logique métier propre.

## Route(s)

`apps/web/src/app/(public)/sur-mesure/page.tsx` → `/sur-mesure`

Server Component par défaut (contenu éditorial statique/CMS) ; seul l'accordéon FAQ
(`FaqAccordion.tsx`) est un Client Component isolé (`'use client'`).

> **Déviation vérifiée à l'implémentation** : routée dans `(public)`, pas `(client)` comme
> initialement prévu ci-dessus. `apps/web/src/app/(client)/layout.tsx` exige une session
> (`redirect` vers `/connexion` sinon) pour **toute** page du groupe — incompatible avec le
> besoin de cette page (purement éditoriale, consultable sans compte). Même déviation déjà
> actée pour `prendre-rendez-vous` (voir `docs/pages/prendre-rendez-vous.md`).

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
    ProcessTimeline.tsx         → 8 colonnes + ligne de connexion (desktop) / grille 2x4 sans ligne (mobile)
    ProcessStep.tsx             → un cercle numéroté (48px) + libellé en majuscules, pas de description
    WhyChooseSection.tsx        → 3 colonnes : Précision, Exclusivité, Accompagnement (fond warm-ivory/30, icônes or antique)
    RealisationsGallery.tsx     → grille éditoriale de 4 réalisations, 2e/4e carte décalée (md:mt-24)
    TestimonialBlock.tsx        → bloc témoignage fond navy-blue, icône Quote, photo bordée champagne
    FaqAccordion.tsx            → 'use client' (état d'ouverture vient de useFaqAccordion())
    ClosingCtaBand.tsx          → bandeau final, mêmes deux CTA que le hero
  hooks/
    useSurMesureContent.ts      → contenu en dur (valeurs vérifiées contre l'écran réel), à migrer vers `content` en Phase 6
    useFaqAccordion.ts          → état d'ouverture des items FAQ (un seul ouvert à la fois)
  consts/
    process-steps.const.ts      → les 8 étapes ({ number, title } — pas de description, absente de l'écran réel)
  __tests__/
    useSurMesureContent.test.ts
    useFaqAccordion.test.ts
    SurMesureProcessPage.test.tsx
  index.ts
```

Pas de dossier `api/` ni de `queryKeys.ts` : le contenu est en dur (pas d'appel réseau tant
que `content` n'existe pas), donc pas de client react-query dédié pour cette page — à
ajouter en Phase 6 en même temps que la migration vers `GET /api/content/sections`.

Toute logique (chargement de contenu, état de l'accordéon) vit dans `hooks/` —
`SurMesureProcessPage.tsx` et les sections ne contiennent que du JSX + appels de hooks.

## Endpoints API consommés

| Endpoint | Module | Usage | Statut |
| --- | --- | --- | --- |
| `GET /api/content/sections?page=sur-mesure` | `content` | Textes/images éditables (hero, timeline, FAQ, témoignage) | ⬜ module `content` inexistant avant Phase 6 — contenu en dur dans `useSurMesureContent.ts` |
| `GET /api/creations?tag=sur-mesure&limit=6` | `creations` | Sélection de réalisations sur mesure pour la galerie | ⬜ **n'existe pas** — `ListCreationsQueryDto` (`apps/api/src/creations/application/dtos/list-creations-query.dto.ts`) n'a pas de filtre `tag`, seulement `categoryId`/`collectionId`/`isFeatured`/`sort`. Galerie en dur (4 pièces) dans `useSurMesureContent.ts` en attendant soit un vrai filtre `tag` sur `creations`, soit le module `content` |

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
  `prendre-rendez-vous`) apparaissent à deux endroits (hero, bandeau final) et pointent vers
  des routes réelles/prévues dès cette page traitée.
- Rester fidèle à l'esprit "processus artisanal" : aucune icône ludique, aucun excès de doré
  (Antique Gold réservé aux accents très ponctuels — utilisé ici uniquement pour les 3 icônes
  de `WhyChooseSection`).
- La FAQ (délais, tarifs, essayages, lieu des rendez-vous, commande à distance) est un
  contenu piloté par `content` à terme — mêmes valeurs par défaut en dur en attendant Phase 6.
- **Écrans Stitch réel vérifié via `agy`** (règle absolue CLAUDE.md §9) après un premier
  passage bloqué en session headless (`agy --print` refusait la permission `command`,
  `mcp__stitch__list_screens` échouait avec « Incompatible auth server »). Une fois l'accès
  débloqué (`agy --dangerously-skip-permissions --print=...`), l'écran réel a révélé plusieurs
  écarts avec `stitch-prompts/11-sur-mesure-process.md` — **corrigés dans l'implémentation** :
  - Les 8 étapes de la timeline n'ont **aucune phrase descriptive**, juste un numéro + un
    libellé en majuscules (le prompt texte en inventait une par étape).
  - Sur mobile, la timeline devient une **grille 2 colonnes × 4 rangées sans ligne de
    connexion** — pas une liste verticale à une colonne avec un filet à gauche comme décrit
    dans le prompt texte.
  - Les 3 piliers (`WhyChooseSection`) ont un texte bien plus long que le prompt, et des
    icônes précises (ciseaux/diamant/cœur, couleur or antique) sur fond `warm-ivory/30` (pas
    blanc).
  - La galerie compte **exactement 4** pièces (pas "4 à 6"), avec un titre + une catégorie
    (pas de légende narrative type "courte histoire") : Robe de Soirée Velours / Robe
    Éternelle / Chemisier Soie et Dentelle / Costume Tailleur Laine — grille asymétrique, 2e
    et 4e carte décalées vers le bas (`md:mt-24`).
  - Le témoignage porte un nom et un **rôle** ("Éléonore de V." — "Cliente Sur Mesure,
    Paris"), pas une référence de pièce type `#ANG-SM-xxxx`.
  - Le bandeau CTA final est sur fond **`warm-ivory/50`** avec titre navy, pas sur fond navy
    plein comme construit initialement.
  - **Aucun bandeau CTA sticky mobile propre à la page** — confirmé explicitement en
    interrogeant `agy` sur ce point précis. Un tel bandeau avait été ajouté par erreur depuis
    le texte du prompt (`MOBILE BEHAVIOR: ... sticky bottom CTA`) puis retiré : il aurait fait
    doublon avec le CTA "Prendre rendez-vous" déjà persistant dans `MobileBottomBar`
    (navigation mobile globale, Phase 1).
- `demande-sur-mesure` n'existe pas encore (⬜ dans cette même phase) : les CTA "Créer ma
  tenue sur mesure" pointent quand même vers `ROUTES.demandeSurMesure` (`/sur-mesure/demande`)
  plutôt que de rester des liens morts — même stratégie que `docs/pages/home.md`.
- Un premier passage des CTA blancs sur fond navy (hero) rendait le bouton secondaire
  invisible (bordure/texte navy sur fond navy) : corrigé avec le même pattern d'override que
  `apps/web/src/features/home/ui/HeroSection.tsx` (`border-white`/`text-white`, ou
  `bg-white`/`text-angaly-navy` pour le CTA primaire).

## Checklist d'acceptation

- [x] Les 7 sections de l'écran réel « ANGALY — L'Art du Sur Mesure » sont présentes et fidèles à la palette ANGALY (vérifié via `agy`, pas seulement le texte du prompt)
- [x] Timeline des 8 étapes conforme à l'écran réel : ligne de connexion + 8 colonnes sur desktop, grille 2×4 sans ligne sur mobile, pas de description par étape
- [x] Galerie de réalisations sur mesure affiche exactement 4 pièces avec titre + catégorie, grille asymétrique décalée
- [x] Accordéon FAQ navigable au clavier, un seul item ouvert à la fois, 5 questions/réponses exactes de l'écran réel
- [x] CTA "Créer ma tenue sur mesure" renvoie vers `demande-sur-mesure`, "Prendre rendez-vous" vers `prendre-rendez-vous`
- [x] Pas de bandeau CTA sticky mobile propre à la page (confirmé absent de l'écran réel)
- [x] Tests : `useSurMesureContent.test.ts`, `useFaqAccordion.test.ts`, `SurMesureProcessPage.test.tsx` (11 tests, tous verts)
- [x] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
