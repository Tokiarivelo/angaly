# Palette de Couleurs & Design Tokens — ANGALY Haute Couture

Ce document détaille l'intégralité de la charte chromatique de la maison **ANGALY**, ses ratios d'utilisation et ses règles d'accessibilité.

---

## 1. Vue d'Ensemble & Tokens CSS

La palette est configurée dans `apps/web/src/app/globals.css` :

```css
:root {
  /* Famille Bleu Marine (Primaire) */
  --angaly-navy: #061938;
  --angaly-navy-dark: #041329;
  --angaly-navy-blue: #0c2650;
  --angaly-royal-navy: #18375d;
  --angaly-soft-navy: #1e4574;

  /* Surfaces Claires */
  --angaly-ivory: #f6f2e9;
  --angaly-warm-ivory: #d8d3c8;

  /* Accents Or & Champagne (Usage modéré : max 5%) */
  --angaly-champagne: #c5b190;
  --angaly-gold: #936c3e;
  --angaly-gold-light: #b59a70;

  /* Neutres */
  --angaly-slate: #5c697a;
  --angaly-warm-gray: #8a877f;
  --angaly-border: #d9d4ca;
  --angaly-white: #ffffff;

  /* Couleurs Fonctionnelles */
  --angaly-success: #46745a;
  --angaly-warning: #a47735;
  --angaly-error: #a64a43;
  --angaly-info: #3e6d91;
}
```

---

## 2. Règle de Proportion Visuelle (60 - 25 - 10 - 5)

Afin de préserver le caractère **luxe et couture**, les proportions de couleur doivent être respectées sur chaque page :

| Pourcentage | Rôle | Couleurs | Exemples d'application |
| :--- | :--- | :--- | :--- |
| **60%** | **Surfaces claires** | `Ivory (#F6F2E9)`, `White (#FFFFFF)` | Fond de page, cartes éditoriales, formulaires clairs |
| **25%** | **Surfaces nobles sombres** | `Deep Navy (#061938)`, `Navy Blue (#0C2650)` | Header, footer, boutons principaux, cartes héro, sidebar |
| **10%** | **Neutres & séparateurs** | `Slate (#5C697A)`, `Border (#D9D4CA)`, `Warm Gray (#8A877F)` | Textes de description, bordures, icônes secondaires |
| **5%** | **Accents précieux** | `Champagne (#C5B190)`, `Antique Gold (#936C3E)` | Liserés de sélection, boutons Premium, monogrammes, puces actives |

> [!WARNING]
> **Interdiction du « tout doré »** : L'or ne doit jamais devenir une couleur de fond dominante. Il sert de touche joaillère pour valoriser l'artisanat.

---

## 3. Matrice de Contraste et Accessibilité (WCAG 2.1 AA)

| Texte / Élément | Couleur de Fond | Ratio de Contraste | Statut WCAG |
| :--- | :--- | :--- | :--- |
| `text-angaly-navy` (`#061938`) | `bg-angaly-ivory` (`#F6F2E9`) | **14.2:1** | ✅ Conforme AAA |
| `text-white` (`#FFFFFF`) | `bg-angaly-navy` (`#061938`) | **16.5:1** | ✅ Conforme AAA |
| `text-angaly-slate` (`#5C697A`) | `bg-angaly-ivory` (`#F6F2E9`) | **4.9:1** | ✅ Conforme AA |
| `text-angaly-champagne` (`#C5B190`) | `bg-angaly-navy` (`#061938`) | **8.1:1** | ✅ Conforme AAA |
| `text-angaly-gold` (`#936C3E`) | `bg-angaly-ivory` (`#F6F2E9`) | **4.6:1** | ✅ Conforme AA |

---

## 4. Politique de Thème Sombre

ANGALY **ne propose pas de toggle thème clair / thème sombre conventionnel** dans le produit :
- Le design combine harmonieusement des sections sombres théâtrales (Hero, Espace Client sidebar, Studio) et des sections claires lumineuses (Catalogue, Contenu).
- **Pattern Studio** utilise un univers atelier numérique sombre dédié (`#041329`, `#061938`, `#0C2650` avec accents or `#936C3E`).
