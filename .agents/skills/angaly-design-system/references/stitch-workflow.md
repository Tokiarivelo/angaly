# Workflow Google Stitch & Intégration Maquettes — ANGALY

Ce document décrit la méthode pour consulter, générer et traduire les maquettes Google Stitch vers l'application Next.js 15 (`apps/web`).

---

## 1. Références du Projet Stitch

- **URL du projet Stitch** : `https://stitch.withgoogle.com/projects/3703874896720765754`
- **ID de projet** : `3703874896720765754`
- **Dossier des prompts sources** : `stitch-prompts/*.md`
- **Table de correspondance obligatoire** : [`docs/mockup-reference.md`](file:///home/tokiarivelo/Documents/Projects/angaly/docs/mockup-reference.md)

---

## 2. Consultation d'une Maquette via StitchMCP

Avant toute intégration ou refonte visuelle :

1. Trouver l'identifiant d'écran dans `docs/mockup-reference.md` (ex: `f7fa235d11dc4832b4d6362bf321c6d3` pour la Médiathèque).
2. Appeler l'outil Stitch MCP :
   ```json
   {
     "ServerName": "StitchMCP",
     "ToolName": "get_screen",
     "Arguments": {
       "name": "projects/3703874896720765754/screens/<screenId>"
     }
   }
   ```
3. Analyser la structure HTML, les dispositions flex/grid, les ratios d'image et les textes éditoriaux de la maquette.

---

## 3. Table de Correspondance Stitch ↔ Tailwind ANGALY

Lors de la conversion du code exporté par Stitch en composants React :

| Style dans l'export Stitch | Remplacement Obligatoire Tailwind ANGALY | Règle Métier |
| :--- | :--- | :--- |
| `border-radius: 12px` ou `rounded-xl` | `rounded-sm` (2px) ou `rounded` (4px) | **Supprimer impérativement les arrondis SaaS** |
| `background: #1e3a8a` (ou bleu générique) | `bg-angaly-navy` (`#061938`) | Bleu signature de la marque ANGALY |
| `background: #f8fafc` (ou gris froid) | `bg-angaly-ivory` (`#F6F2E9`) | Remplacer par l'ivoire chaleureux |
| `font-family: serif` ou Polices tierces | `font-heading` (`Cormorant Garamond`) | Typographie d'exception pour les titres |
| `font-family: sans-serif` | `font-sans` (`Inter`) | Typographie nette d'interface |
| Bouton d'action doré prédominant | Bouton `bg-angaly-navy` text-white | **L'or est réservé aux actions Premium Studio** |
| `box-shadow: 0 10px 25px rgba(...)` | `shadow-xs` ou `shadow-sm` | Ombres discrètes et architecturales |
| Bordures épaisses et sombres | `border border-angaly-border` (`#D9D4CA`) | Finesse du trait |

---

## 4. Anti-Patterns à Éliminer Systématiquement

1. ❌ **Arrondis excessifs** : `rounded-2xl`, `rounded-3xl` sur des conteneurs de formulaire ou des cartes.
2. ❌ **Gradients vifs ou multicolores** : Dégradés flashy violets/oranges/bleus.
3. ❌ **Fond 100% noir pur (`#000000`)** : Remplacer par le marine profond `#041329` ou `#061938`.
4. ❌ **Pastilles multicolores criardes** : Remplacer les badges verts fluo ou roses par des pastilles pastel atténuées (`bg-angaly-success/10 text-angaly-success`, `bg-angaly-champagne/15 text-angaly-navy`).
5. ❌ **Logique dans les pages Next.js** : La page `app/<path>/page.tsx` doit uniquement importer et monter le composant de feature (`features/<name>/ui/<Component>`).
