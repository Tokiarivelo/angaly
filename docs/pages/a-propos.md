# Page — `a-propos`

**Statut : ✅ Fait.** Phase 1 — Présence digitale.

## Objet

Page de marque racontant l'histoire de la maison — fondatrice, savoir-faire, philosophie,
atelier, valeurs, vision (spec §39-40). Construit la confiance, pas la conversion directe.

## Route(s)

`apps/web/src/app/(public)/a-propos/page.tsx` → `/a-propos`

**Client Component depuis la session 2026-09-16 (suite)** — `AProposPage` appelle désormais
`useAProposContent()`, qui lit `GET /api/content/public/a-propos` via react-query ; `'use
client'` ajouté en tête de `AProposPage.tsx` (même pattern que `home`). Avant cette session,
c'était un vrai Server Component (contenu 100 % statique) — voir "Points d'attention".

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
    useAProposContent.ts             → lit les PageSection (page="a-propos") via react-query, fusionne
                                        par sectionKey sur les littéraux par défaut, voir Points d'attention
  api/
    a-propos.api.ts                  → useAProposSectionsContentQuery
  consts/
    queryKeys.ts
  __tests__/
    useAProposContent.test.ts
    AProposPage.test.tsx
  index.ts
```

**Pas de `ValeursSection.tsx`** — voir Points d'attention.

Toute logique (contenu) vit dans `hooks/` — `AProposPage.tsx` et les sections ne
contiennent que du JSX + appels de hooks.

## Endpoints API consommés

| Endpoint | Module | Usage |
| --- | --- | --- |
| `GET /api/content/public/a-propos` | `content` | **Réel** (câblé session 2026-09-16, suite) — `PUBLISHED`-only, sans auth ; `useAProposContent.ts` merge les sections reçues sur les littéraux par défaut par `sectionKey`, repli complet pour toute section absente/encore `DRAFT` |

## Modèles Prisma touchés

`PageSection`, `Media` — 7 sections (`hero`, `histoire`, `fondatrice`, `savoir-faire`, `philosophie`, `atelier`, `vision`) sont seedées dans `packages/database/prisma/seed.ts` (`page = "a-propos"`) avec photos hébergées sur MinIO. En frontend, `useAProposContent.ts` lit désormais le texte de ces `PageSection` en base (`GET /api/content/public/a-propos`, voir Points d'attention), et fournit les photos haute résolution vérifiées issues de la maquette Stitch (toujours codées en dur, pas encore lues depuis `Media`).

## Points d'attention

- **Fidélité vérifiée via `agy`/StitchMCP `get_screen`** (écran réel
  `028e4d74f15f4ad2b2a16424bacb5448`), pas seulement `stitch-prompts/21-a-propos.md`.
  **L'écran réel a 7 sections, pas 8** : pas de section « Valeurs » (Excellence/
  Authenticité/Exclusivité/Proximité client) — absente du design réel. `AProposPage.test.tsx` et
  le test E2E Playwright vérifient explicitement son absence.
- **Contenu texte réellement piloté par `PageSection`** depuis la session 2026-09-16
  (suite) : `useAProposContent.ts` lit `GET /api/content/public/a-propos` (voir
  `docs/features/content.md` "Endpoint public") et fusionne les 7 sections `PUBLISHED`
  reçues sur les littéraux par défaut, par `sectionKey` (`hero`, `histoire`, `fondatrice`,
  `savoir-faire`, `philosophie`, `atelier`, `vision`). Une section absente du CMS (jamais
  éditée, ou seulement `DRAFT`) retombe entièrement sur le littéral codé en dur ; à
  l'intérieur d'une section présente, un champ individuel `null`/absent/malformé (ex. un
  `dataJson.items` qui ne correspond pas à la forme attendue) retombe aussi sur son propre
  champ par défaut plutôt que de casser le rendu. **Les images (`imageUrl` de `hero`,
  `histoire`, `fondatrice`, `atelier`) restent codées en dur** — contrairement à `home`, cette
  page n'a pas de requête `/media` par heuristique de texte alternatif ; câbler les images
  reste hors périmètre de cette session (voir `docs/pages/home.md` pour le pattern existant
  côté `home`, réutilisable telle quelle si une session future migre les images ici aussi).
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
- [x] `useAProposContent.ts` lit réellement `GET /api/content/public/a-propos` (react-query),
      avec repli testé sur les littéraux codés en dur pour toute section absente/`DRAFT`, et
      pour tout champ `dataJson` individuel malformé (chronology/quote/items)
- [x] Tests unitaires : `useAProposContent.test.ts`, `AProposPage.test.tsx`
- [x] Tests E2E Playwright : `apps/web/e2e/a-propos/heritage-a-propos.spec.ts` (desktop + mobile passants)
- [x] Captures visuelles sauvegardées dans les artefacts (`heritage_a_propos_desktop.png`, `heritage_a_propos_mobile.png`)
- [x] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
