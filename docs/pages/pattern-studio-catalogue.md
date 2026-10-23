# Page — `pattern-studio-catalogue`

**Statut : ✅ Fait (2026-10-21).** Phase 4 — Premium (Angaly Pattern Studio).

## Objet

« Catalogue des patrons » : les robes que le moteur de patronage sait réaliser (36 au 2026-10-21, de la cotte
médiévale à la robe chemise, mariée comprise), chacune avec **la photo de son inspiration d'origine** (photo de musée
ou d'archive sous licence libre, crédit affiché), son époque, sa description, son nombre de pièces et son métrage
indicatif. Le client part d'un modèle : « Créer ce patron » crée un projet pré-rempli (coupe, détails, ampleurs,
garnitures, pièces de construction, couleurs pour la 3D, photo) puis ouvre l'assistant pour saisir ses mesures et générer.

## Route

`/pattern-studio/catalogue` — `apps/web/src/app/(client)/pattern-studio/catalogue/page.tsx` (page vide de logique) →
`features/pattern-studio-catalog` (`PatternCatalogPage`).

## Maquette

**Écran dédié non généré** : Stitch a échoué (MCP `generate_screen_from_text` ×3 et `agy` en délai dépassé). La page
reprend à l'identique les composants de l'écran réel « ANGALY — Mes projets de patron » (en-tête, cartes à barre champagne,
boutons dorés) ; couleurs fixes de la maquette dans les cartes (#061938, #5C697A) car le thème sombre de l'espace
client éclaircit `text-angaly-primary`. À remplacer par l'écran ci-dessous quand Stitch le génère :

Écran Stitch (à créer) « ANGALY Pattern Studio — Catalogue des patrons » (projet 3703874896720765754), même coque que « ANGALY —
Mes projets de patron » : barre latérale navy, barre haute ivoire, titre Cormorant, puces de filtre (Tous / Modernes /
Historiques / Mariée), recherche, grille de 3 colonnes de cartes blanches à fine barre champagne : photo 4:5, époque en
capitales dorées, nom, description, « N pièces · x,xx m », crédit photo, bouton doré « Créer ce patron », lien « Voir
les pièces » (liste des pièces générées).

## Données

- `GET /api/pattern-catalog` (module API `pattern-catalog`, authentifié) → `PatternCatalogEntryDto[]` (`@angaly/types`).
  Les entrées viennent du catalogue du moteur (`packages/pattern-engine/src/catalog/dress-catalog.ts`), générées une
  fois aux mensurations de référence ; les photos sont des Media MinIO (`altText` `catalog:<id> …`) envoyées par
  `apps/ai-service/ml/scripts/seed_pattern_catalog.py` ; les crédits dans
  `apps/api/src/pattern-catalog/infrastructure/data/catalog-inspirations.json`.
- `POST /api/pattern-catalog/:id/projects` → `{ projectId }` (projet du client, avec sa propre ligne Media vers la photo).

## Accès

Lien « Catalogue des patrons » dans l'en-tête de « Mes projets de patron ».

## Tests

`features/pattern-studio-catalog/__tests__/` (hook, composants), API `src/pattern-catalog/__tests__/` (cas d'usage,
contrôleur).
