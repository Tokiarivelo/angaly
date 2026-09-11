# Page — `a-propos`

**Statut : ✅ Fait.** Phase 1 — Présence digitale.

## Objet

Page de marque racontant l'histoire de la maison — fondatrice, savoir-faire, philosophie,
atelier, valeurs, vision (spec §39-40). Construit la confiance, pas la conversion directe.

## Route(s)

`apps/web/src/app/(public)/a-propos/page.tsx` → `/a-propos`

**Vrai Server Component** — contrairement à `home`/`la-une`/`nos-creations-galerie`/
`creation-detail`/`collections-liste`/`collection-detail`, `AProposPage` n'appelle aucun
hook react-query (contenu 100 % statique en attendant `content`/Phase 6) et n'a donc pas
besoin de `'use client'`. Aucun état interactif significatif requis par la maquette.

## Référence maquette

- Prompt Stitch : `stitch-prompts/21-a-propos.md`
- Écran Stitch : **ANGALY — Notre Histoire (À propos)**
- Section spécification : §39-40 (`docs/specifications/ANGALY_Specifications_Completes.md`)

## Arborescence de composants (livrée)

```
apps/web/src/features/a-propos/
  ui/
    AProposPage.tsx                → orchestre les 7 sections réelles (pas 8, voir plus bas), JSX + hooks uniquement
    HistoireHeroSection.tsx        → hero 70vh + titre serif + sous-titre italique champagne
    NotreHistoireSection.tsx       → deux colonnes photo (cadre blanc) + récit + chronologie (1998/2010)
    FondatriceSection.tsx           → « Qui est Angaly ? » portrait (cadre décoratif) + bio + citation
    SavoirFaireSection.tsx          → 4 colonnes, 2 vraies photos + 2 tuiles icône (Broderie/Finitions) — fidèle à l'écran réel
    PhilosophieQuoteBand.tsx        → citation éditoriale pleine largeur, fond navy, guillemets décoratifs
    AtelierGallerySection.tsx        → grille 4 colonnes, 1 tuile 2×2 + 3 tuiles simples dont une icône
    VisionClosingSection.tsx          → citation de fermeture + CTA (Découvrir nos créations / Prendre rendez-vous)
  hooks/
    useAProposContent.ts             → contenu 100 % codé en dur (Phase 6/`content` en attente), voir Points d'attention
  __tests__/
    useAProposContent.test.ts
    AProposPage.test.tsx
  index.ts
```

**Pas de `ValeursSection.tsx`** — voir Points d'attention. Pas d'`api/`/`consts/` : sans
`content` (Phase 6), il n'y a aucun appel réseau à faire pour cette page.

Toute logique (contenu) vit dans `hooks/` — `AProposPage.tsx` et les sections ne
contiennent que du JSX + appels de hooks.

## Endpoints API consommés

Aucun — page 100 % statique en Phase 1 (voir Points d'attention). `AProposPage` ne fait
aucun appel réseau.

## Modèles Prisma touchés

`PageSection`, `Media` — 7 sections (`hero`, `histoire`, `fondatrice`, `savoir-faire`, `philosophie`, `atelier`, `vision`) sont seedées dans `packages/database/prisma/seed.ts` (`page = "a-propos"`) avec photos hébergées sur MinIO. En frontend, `useAProposContent.ts` fournit le contenu et les photos haute résolution vérifiées issues de la maquette Stitch.

## Points d'attention

- **Fidélité vérifiée via `agy`/StitchMCP `get_screen`** (écran réel
  `028e4d74f15f4ad2b2a16424bacb5448`), pas seulement `stitch-prompts/21-a-propos.md`.
  **L'écran réel a 7 sections, pas 8** : pas de section « Valeurs » (Excellence/
  Authenticité/Exclusivité/Proximité client) — absente du design réel. `AProposPage.test.tsx` et
  le test E2E Playwright vérifient explicitement son absence.
- **Photos et médias** : Toutes les photographies de la maquette Stitch et d'Unsplash sont
  intégrées :
  - Hero (70vh avec `mix-blend-overlay` sur fond navy)
  - Notre Histoire (machine Singer patrimoniale)
  - Portrait de Madame Angaly avec cadre champagne décalé
  - Savoir-Faire (alternance couture main, patronage sur mesure, broderie navy/champagne, finitions ivoire/navy)
  - Galerie Atelier (mosaïque éditoriale 4 colonnes, tuile 2×2, rouleaux de tissus, Matières Nobles, soierie rose drapée)
- Les sections sont également persistées en base PostgreSQL via `prisma/seed.ts` avec attachement
  de médias MinIO.

## Checklist d'acceptation

- [x] Les 7 sections réelles sont présentes et fidèles à la palette ANGALY (pas de section « Valeurs » inventée)
- [x] Section « Qui est Angaly ? » avec citation de la fondatrice et portrait dans son cadre décoratif
- [x] Bande citation « Notre philosophie » sur fond navy avec contraste texte suffisant
- [x] Galerie Atelier 4 colonnes responsive (1 tuile 2×2 + 3 tuiles dont « Matières Nobles »)
- [x] `<title>`/meta description définis (spec §70)
- [x] Seeds `PageSection` pour `page = "a-propos"` dans `packages/database/prisma/seed.ts` avec upload MinIO
- [x] Tests unitaires : `useAProposContent.test.ts`, `AProposPage.test.tsx` (4 tests passants)
- [x] Tests E2E Playwright : `apps/web/e2e/a-propos/heritage-a-propos.spec.ts` (desktop + mobile passants)
- [x] Captures visuelles sauvegardées dans les artefacts (`heritage_a_propos_desktop.png`, `heritage_a_propos_mobile.png`)
- [x] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
