---
name: angaly-design-system
description: >-
  Rules, tokens, component patterns, and guidelines for the ANGALY Haute Couture Design System.
  Use this skill whenever creating, styling, modifying, or refactoring UI components or pages in apps/web,
  adapting mockups or wireframes to the couture visual identity, applying colors (#061938 Navy, #F6F2E9 Ivory,
  #936C3E Antique Gold, #C5B190 Champagne), typography (Cormorant Garamond serif headings, Inter sans-serif body),
  borders (#D9D4CA), cards, buttons, drawers, modals, tables, or integrating Google Stitch mockups.
---

# ANGALY Haute Couture Design System Skill

Ce skill fournit les directives complètes, les tokens de design, les patrons de composants et le protocole d'intégration visuelle pour la maison de haute couture **ANGALY** (Madagascar).

---

## 1. Philosophie & Identité Visuelle

L'univers ANGALY s'inspire d'une maison de haute couture et d'un atelier d'artisanat d'art :
- **Dominante sobre et noble** : alliance du bleu marine très profond (`#061938`), de l'ivoire chaleureux (`#F6F2E9`) et de touches de champagne (`#C5B190`) et d'or antique (`#936C3E`).
- **Sensation** : atelier de couture sur mesure, élégant, intemporel, artisanal, éditorial et chaleureux.
- **Règle d'or anti-SaaS** : **Jamais d'arrondis « bubble » façon SaaS B2B** (`rounded-xl`, `rounded-2xl`). Tout composant utilise des angles nets ou subtilement adoucis (`rounded-sm` = 2px, ou `rounded` = 4px).
- **Proportion 60-25-10-5** :
  - **60%** : Surfaces claires & ivoire (`#F6F2E9`, `#FFFFFF`).
  - **25%** : Bleu marine profond & déclinaisons sombres (`#061938`, `#0C2650`).
  - **10%** : Neutres, ardoise et bordures (`#5C697A`, `#D9D4CA`).
  - **5%** : Accents dorés / champagne (`#936C3E`, `#C5B190`). L'or doit rester un liseré, un badge ou un détail, jamais un aplat massif.

---

## 2. Tokens Principaux (Cheatsheet)

Toutes les couleurs sont définies dans `apps/web/src/app/globals.css` et mappées en classes Tailwind v4 :

| Nom Token | HEX | Classe Background | Classe Texte | Classe Border | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Deep Navy** | `#061938` | `bg-angaly-navy` | `text-angaly-navy` | `border-angaly-navy` | Couleur primaire de marque, headers, boutons CTA, footers, surfaces sombres |
| **Navy Dark** | `#041329` | `bg-angaly-navy-dark` | `text-angaly-navy-dark` | `border-angaly-navy-dark` | Hover sombre, Pattern Studio canvas, overlays |
| **Navy Blue** | `#0C2650` | `bg-angaly-navy-blue` | `text-angaly-navy-blue` | `border-angaly-navy-blue` | Surfaces secondaires sombres, cartes actives |
| **Royal Navy** | `#18375D` | `bg-angaly-royal-navy` | `text-angaly-royal-navy` | `border-angaly-royal-navy` | Bordures sur fond sombre, séparateurs latéraux |
| **Soft Navy** | `#1E4574` | `bg-angaly-soft-navy` | `text-angaly-soft-navy` | `border-angaly-soft-navy` | Liens actifs, anneaux de focus, accents UI |
| **Ivory** | `#F6F2E9` | `bg-angaly-ivory` | `text-angaly-ivory` | `border-angaly-ivory` | Fond général clair, remplace le blanc pur |
| **Warm Ivory** | `#D8D3C8` | `bg-angaly-warm-ivory` | `text-angaly-warm-ivory` | `border-angaly-warm-ivory` | Surfaces douces, badges clairs, texte sur fond sombre |
| **Champagne** | `#C5B190` | `bg-angaly-champagne` | `text-angaly-champagne` | `border-angaly-champagne` | Détails premium, sous-titres couture, icônes |
| **Antique Gold** | `#936C3E` | `bg-angaly-gold` | `text-angaly-gold` | `border-angaly-gold` | Boutons Premium Studio, liserés de sélection active |
| **Soft Gold** | `#B59A70` | `bg-angaly-gold-light` | `text-angaly-gold-light` | `border-angaly-gold-light` | Hover des accents dorés |
| **Slate** | `#5C697A` | `bg-angaly-slate` | `text-angaly-slate` | `border-angaly-slate` | Texte secondaire, métadonnées, descriptions |
| **Warm Gray** | `#8A877F` | `bg-angaly-warm-gray` | `text-angaly-warm-gray` | `border-angaly-warm-gray` | Placeholders, informations tertiaires |
| **Border** | `#D9D4CA` | `bg-angaly-border` | - | `border-angaly-border` | Bordures de cartes, inputs, séparateurs |
| **Success** | `#46745A` | `bg-angaly-success` | `text-angaly-success` | `border-angaly-success` | Statut publié, validation commande |
| **Warning** | `#A47735` | `bg-angaly-warning` | `text-angaly-warning` | `border-angaly-warning` | Alertes, avertissements stock |
| **Error** | `#A64A43` | `bg-angaly-error` | `text-angaly-error` | `border-angaly-error` | Erreurs de validation, actions destructives |
| **Info** | `#3E6D91` | `bg-angaly-info` | `text-angaly-info` | `border-angaly-info` | Informations de process |

---

## 3. Typographie

1. **Titres & Headings** :
   - Variable : `var(--font-heading)`
   - Police : **Cormorant Garamond** (Google Fonts via `apps/web/src/lib/fonts.ts`), repli serif Georgia.
   - Classe Tailwind : `font-heading`
   - Utilisations :
     - Grands titres de page : `font-heading text-3xl md:text-4xl text-angaly-navy font-normal` (ou `font-serif`).
     - Sous-titres et titrages éditoriaux : `font-heading italic text-xl md:text-2xl text-angaly-navy`.
     - Titres de section : `font-heading text-2xl tracking-wide`.

2. **Interface, Formulaires & Corps de texte** :
   - Variable : `var(--font-sans)`
   - Police : **Inter** (`apps/web/src/lib/fonts.ts`).
   - Classe Tailwind : `font-sans`
   - Utilisations :
     - Navigation & badges : `text-xs uppercase tracking-widest font-medium`.
     - Labels de formulaire : `text-xs font-medium uppercase tracking-wider text-angaly-slate`.
     - Textes courants : `text-sm leading-relaxed text-angaly-slate` (ou `text-angaly-navy` pour le corps principal).

---

## 4. Patrons de Composants Standard

### 4.1 Boutons (`Button`)
Voir [`apps/web/src/components/ui/button.tsx`](file:///home/tokiarivelo/Documents/Projects/angaly/apps/web/src/components/ui/button.tsx) :
- **Primary** (`variant="default"`) : Fond marine `#061938`, texte blanc, hover marine profond `#0C2650`, `rounded-sm`.
- **Secondary / Outline** (`variant="secondary"`) : Fond transparent, bordure marine `#061938`, texte marine, hover inversé.
- **Premium** (`variant="premium"`) : Fond or antique `#936C3E`, texte blanc, hover or clair `#B59A70`. Réservé à Pattern Studio et aux services exclusifs.
- **Ghost** (`variant="ghost"`) : Transparent, texte marine, hover ivoire chaud `#D8D3C8`.

### 4.2 Cartes (`Cards`)
- **Carte claire standard** :
  ```tsx
  <div className="bg-white border border-angaly-border rounded-sm p-6 shadow-sm">
    ...
  </div>
  ```
- **Carte sélectionnée / active** :
  ```tsx
  <div className="bg-white border-2 border-angaly-gold rounded-sm p-6 shadow-sm relative">
    {/* Badge checkmark or discret en coin */}
  </div>
  ```
- **Carte sombre premium (Pattern Studio / Header)** :
  ```tsx
  <div className="bg-angaly-navy-blue border border-angaly-royal-navy rounded-sm p-6 text-white">
    ...
  </div>
  ```

### 4.3 Formulaires & Recherche
- Champs de saisie : `rounded-sm border border-angaly-border bg-white px-3 py-2 text-sm text-angaly-navy focus:border-angaly-gold focus:ring-1 focus:ring-angaly-gold focus:outline-none`.
- Labels : `<label className="block text-xs font-medium uppercase tracking-wider text-angaly-slate mb-1.5">`.

### 4.4 Pastilles de Statut (Badges)
- Publié / Confirmé : `bg-angaly-success/10 text-angaly-success border border-angaly-success/20 text-xs px-2.5 py-0.5 rounded-sm font-medium`.
- Brouillon / Neutre : `bg-angaly-slate/10 text-angaly-slate border border-angaly-slate/20 text-xs px-2.5 py-0.5 rounded-sm font-medium`.
- En cours / Accent : `bg-angaly-champagne/15 text-angaly-navy border border-angaly-champagne/30 text-xs px-2.5 py-0.5 rounded-sm font-medium`.

---

## 5. Protocole d'Intégration d'une Maquette Stitch

Lors de l'implémentation ou de la refonte d'un écran Stitch :

1. **Consulter la maquette réelle** via `docs/mockup-reference.md` ou l'outil Stitch (`get_screen` sur le projet `3703874896720765754`).
2. **Identifier la hiérarchie** :
   - En-tête : Titre serif `font-heading`, actions principales à droite en bouton sombre `bg-angaly-navy`.
   - Filtres / Puces : Barre horizontale avec fond `bg-angaly-ivory/80`, puces actives en marine ou or.
   - Conteneur de travail : Grille ou tableau bordé de `#D9D4CA` avec fond blanc ou ivoire.
   - Volet latéral rétractable : Tiroir à droite (`w-80` ou `w-96`) bordé à gauche par `#D9D4CA`.
3. **Tester systématiquement l'accessibilité** :
   - Tout contrôle interactif doit comporter un `aria-label`, `role`, et être opérable au clavier.
   - Les cases à cocher utilisent `role="checkbox"` et `aria-checked`.
4. **Vérifier les tests & le typecheck** :
   - `pnpm typecheck` (0 erreur).
   - Vitest sur la feature concernée (80%+ couverture).

---

## 6. Références Détaillées

- [Palette & Design Tokens](./references/color-palette.md) : Valeurs complètes, contrastes WCAG, et variables CSS.
- [Guide Typographique](./references/typography.md) : Hiérarchie des titres, tailles et interlignes.
- [Bibliothèque de Composants Couture](./references/components.md) : Spécifications complètes des composants.
- [Workflow Stitch](./references/stitch-workflow.md) : Correspondance Maquette Stitch ↔ Composants Tailwind.
- [Exemples de Code](./examples/) : Exemples TSX prêts à l'emploi.
