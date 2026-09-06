# Page — `a-propos`

**Statut : ⬜ À faire.** Phase 1 — Présence digitale.

## Objet

Page de marque racontant l'histoire de la maison — fondatrice, savoir-faire, philosophie,
atelier, valeurs, vision (spec §39-40). Construit la confiance, pas la conversion directe.

## Route(s)

`apps/web/src/app/(public)/a-propos/page.tsx` → `/a-propos`

Server Component par défaut (contenu quasi entièrement statique/CMS) ; aucun état
interactif significatif n'est requis par la maquette (pas de formulaire, pas de filtre).

## Référence maquette

- Prompt Stitch : `stitch-prompts/21-a-propos.md`
- Écran Stitch : **ANGALY — Notre Histoire (À propos)**
- Section spécification : §39-40 (`docs/specifications/ANGALY_Specifications_Completes.md`)

## Arborescence de composants attendue

```
apps/web/src/features/a-propos/
  ui/
    AProposPage.tsx                → orchestre les 8 sections, JSX + hooks uniquement
    HistoireHeroSection.tsx        → hero photo atelier/fondatrice + titre serif + sous-titre italique
    NotreHistoireSection.tsx       → deux colonnes photo + récit + chronologie éventuelle
    FondatriceSection.tsx           → « Qui est Angaly ? » portrait + bio + citation
    SavoirFaireSection.tsx          → 3-4 colonnes (Couture main, Broderie, Patronage sur mesure, Finitions artisanales)
    PhilosophieQuoteBand.tsx        → citation éditoriale pleine largeur, fond navy
    AtelierGallerySection.tsx        → galerie éditoriale 4-6 photos de l'atelier
    ValeursSection.tsx               → grille de cartes valeurs (Excellence, Authenticité, Exclusivité, Proximité client)
    VisionClosingSection.tsx          → citation de fermeture + CTA (Découvrir nos créations / Prendre rendez-vous)
  hooks/
    useAProposContent.ts             → lit les PageSection (page="a-propos") via react-query
  api/
    a-propos.api.ts                   → useAProposContentQuery
  consts/
    queryKeys.ts
  __tests__/
    useAProposContent.test.ts
    AProposPage.test.tsx
  index.ts
```

Toute logique (fetch du contenu) vit dans `hooks/` — `AProposPage.tsx` et les sections ne
contiennent que du JSX + appels de hooks.

## Endpoints API consommés

| Endpoint | Module | Usage |
| --- | --- | --- |
| `GET /api/content/sections?page=a-propos` | `content` | Textes/photos éditables de chaque section (Phase 6) |
| `GET /api/ateliers?limit=` | `ateliers` | (optionnel, Phase 1) photos réelles d'atelier pour la Section 6 en l'absence de contenu CMS dédié |

## Modèles Prisma touchés

`PageSection` (lecture, `page = "a-propos"`, Phase 6), `Media` (via `PageSection.mediaId`,
ou via `Atelier.media` si réutilisé en Phase 1).

## Points d'attention

- Comme `docs/pages/home.md`, cette page dépend entièrement de `PageSection`/Phase 6 pour
  son contenu éditorial (histoire, bio de la fondatrice, valeurs, citations) : en Phase 1,
  avant que `content` existe, utiliser des valeurs par défaut codées en dur dans
  `useAProposContent.ts` avec un TODO explicite pointant vers cette fiche.
- Aucun modèle Prisma ne porte « fondatrice »/« équipe »/« valeurs de la maison » — ce sont
  des blocs de texte/média purement éditoriaux (`PageSection.bodyText`/`dataJson`), pas des
  entités métier ; ne pas créer de modèle Prisma dédié pour ce contenu.
- La chronologie (Section 2, éventuelle) et les cartes de valeurs (Section 7) n'ont pas de
  structure typée dans Prisma : les représenter via `PageSection.dataJson` (tableau
  d'items) une fois `content` livré, typé côté `@angaly/types` (règle absolue #2 — jamais
  de `Record<string, unknown>` libre).
- Galerie atelier (Section 6) : en Phase 1, peut réutiliser les photos déjà uploadées pour
  `Atelier.media` (`MediaEntityType.ATELIER`) si aucun contenu CMS dédié n'existe encore,
  plutôt que d'attendre `content`.
- Respecter le ton « intime et humain » du prompt Stitch : éviter tout style « corporate
  about-us » générique, pas de photos de stock visibles.

## Checklist d'acceptation

- [ ] Les 8 sections de `stitch-prompts/21-a-propos.md` sont présentes et fidèles à la palette ANGALY
- [ ] Section « Qui est Angaly ? » avec citation de la fondatrice mise en avant visuellement
- [ ] Bande citation « Notre philosophie » sur fond navy avec contraste texte suffisant (a11y)
- [ ] Comportement mobile : sections deux colonnes empilées, chronologie en timeline verticale, galeries swipeables
- [ ] `<title>`/meta description définis (spec §70)
- [ ] Tests : `useAProposContent.test.ts`, `AProposPage.test.tsx`
- [ ] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
