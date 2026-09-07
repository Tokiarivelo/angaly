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

Aucun en Phase 1. `PageSection` (lecture, `page = "a-propos"`) une fois Phase 6 livrée.

## Points d'attention

- **Fidélité vérifiée via `agy`/StitchMCP `get_screen`** (écran réel
  `028e4d74f15f4ad2b2a16424bacb5448`), pas seulement `stitch-prompts/21-a-propos.md`.
  **L'écran réel n'a que 7 sections, pas 8** : pas de section « Valeurs » (Excellence/
  Authenticité/Exclusivité/Proximité client) — implicite dans le prompt texte seul, absente
  du design réel. `ValeursSection.tsx` n'a donc pas été créé plutôt que d'inventer son
  contenu ; `AProposPage.test.tsx` vérifie explicitement son absence pour éviter qu'elle
  soit réintroduite par erreur.
- Comme `docs/pages/home.md`, cette page dépendra de `PageSection`/Phase 6 pour son contenu
  éditorial une fois ce module livré : en Phase 1, valeurs codées en dur dans
  `useAProposContent.ts` avec un TODO explicite pointant vers cette fiche.
- Aucun modèle Prisma ne porte « fondatrice »/« équipe » — blocs de texte/média purement
  éditoriaux, jamais un modèle Prisma dédié.
- **Photos** : contenu 100 % éditorial (pas de `Creation`/`Collection`/`Atelier` associé),
  donc pas de seed en base — les URLs Unsplash réelles (mêmes règles de vérification que le
  seed de `packages/database/prisma/seed.ts` : plain `images.unsplash.com`, jamais
  `plus.unsplash.com`) sont codées en dur dans `useAProposContent.ts` aux côtés du texte.
  Hero et portrait de la fondatrice restent en dégradé faute d'une photo pertinente trouvée
  (pas d'invention) — à remplacer dès que `content`/Phase 6 permet un vrai upload.
- Respecter le ton « intime et humain » du prompt Stitch : éviter tout style « corporate
  about-us » générique.

## Checklist d'acceptation

- [x] Les 7 sections réelles sont présentes et fidèles à la palette ANGALY (pas de section « Valeurs » inventée)
- [x] Section « Qui est Angaly ? » avec citation de la fondatrice mise en avant visuellement
- [x] Bande citation « Notre philosophie » sur fond navy avec contraste texte suffisant
- [x] `<title>`/meta description définis (spec §70)
- [x] Tests : `useAProposContent.test.ts`, `AProposPage.test.tsx` — 3 tests
- [x] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
