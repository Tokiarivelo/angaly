# Typographie & Hiérarchie Éditoriale — ANGALY Haute Couture

L'identité typographique d'**ANGALY** repose sur le contraste entre la grâce d'un serif haute couture et la précision d'un sans-serif moderne.

---

## 1. Polices de Caractères

### 1.1 Titres Éditoriaux : Cormorant Garamond
- **Rôle** : Grands titres, titrages éditoriaux, noms de collections, citations d'atelier.
- **Variable CSS** : `--font-heading`
- **Classe Tailwind** : `font-heading` (ou `font-serif`)
- **Caractéristiques** :
  - Lignes fines, sérifs ciselés inspirés de la gravure classique.
  - S'utilise avec des graisses légères à moyennes (`font-normal` 400 ou `font-medium` 500).
  - L'italique (`italic`) est employé pour les sous-titres raffinés ou les termes d'atelier (*« Sur Mesure »*, *« Patronage d'exception »*).

### 1.2 Interface & Corps de Texte : Inter
- **Rôle** : Navigation, boutons, métadonnées, formulaires, tableaux, corps de texte.
- **Variable CSS** : `--font-sans`
- **Classe Tailwind** : `font-sans`
- **Caractéristiques** :
  - Lisibilité optimale à toutes les échelles d'écran.
  - Graisses : `font-normal` (400), `font-medium` (500), `font-semibold` (600).
  - Très souvent utilisé en minuscules capitalisées (`uppercase`) avec espacement de lettres accentué (`tracking-wider` ou `tracking-widest`) pour les micro-labels.

---

## 2. Échelle Typographique Recommandée

| Niveau / Rôle | Famille | Taille & Interligne | Graisse & Style | Exemple de Classes Tailwind |
| :--- | :--- | :--- | :--- | :--- |
| **Hero Title** | Serif | `text-4xl md:text-6xl lg:text-7xl` | `font-normal tracking-tight` | `font-heading text-5xl md:text-6xl text-angaly-navy font-normal` |
| **Page Title (H1)** | Serif | `text-3xl md:text-4xl` | `font-normal tracking-tight` | `font-heading text-3xl md:text-4xl text-angaly-navy` |
| **Section Title (H2)** | Serif | `text-2xl md:text-3xl` | `font-normal` | `font-heading text-2xl md:text-3xl text-angaly-navy` |
| **Sous-titre Éditorial** | Serif | `text-lg md:text-xl` | `italic text-angaly-slate` | `font-heading italic text-lg text-angaly-slate` |
| **Card Title (H3)** | Serif / Sans | `text-lg md:text-xl` | `font-medium` | `font-heading text-xl text-angaly-navy` |
| **Section Eyebrow / Surtitre** | Sans | `text-xs` | `uppercase tracking-widest font-medium text-angaly-champagne` | `font-sans text-xs uppercase tracking-widest text-angaly-champagne` |
| **Corps de Texte Courant** | Sans | `text-sm md:text-base` | `leading-relaxed text-angaly-slate` | `font-sans text-sm leading-relaxed text-angaly-slate` |
| **Navigation & Liens** | Sans | `text-xs xl:text-sm` | `uppercase tracking-wider font-medium` | `font-sans text-xs uppercase tracking-wider text-angaly-navy` |
| **Labels de Formulaire** | Sans | `text-xs` | `uppercase tracking-wider font-medium text-angaly-slate` | `text-xs font-medium uppercase tracking-wider text-angaly-slate` |
| **Badges & Métadonnées** | Sans | `text-[10px] md:text-xs` | `tracking-wide font-medium` | `text-xs tracking-wide font-medium text-angaly-navy` |

---

## 3. Formules Typographiques Signature

### Formule 1 : En-tête de Page de Back-Office ou Dashboard
```tsx
<div className="flex flex-col gap-1">
  <span className="text-xs uppercase tracking-widest text-angaly-champagne font-medium">
    Atelier Numérique
  </span>
  <h1 className="font-heading text-3xl md:text-4xl text-angaly-navy font-normal">
    Médiathèque des Créations
  </h1>
  <p className="font-sans text-xs md:text-sm text-angaly-slate">
    Gérez les photographies haute résolution de vos collections et patrons.
  </p>
</div>
```

### Formule 2 : Titrage de Collection Éditoriale
```tsx
<div className="text-center py-12">
  <p className="text-xs uppercase tracking-widest text-angaly-gold mb-2">
    Collection Automne — Hiver
  </p>
  <h2 className="font-heading text-4xl md:text-5xl text-angaly-navy mb-4 font-normal">
    L’Éclat du Velours Malgache
  </h2>
  <div className="w-12 h-px bg-angaly-gold mx-auto my-4" />
  <p className="max-w-xl mx-auto font-sans text-sm text-angaly-slate leading-relaxed">
    Chaque pièce est coupée sur mesure dans notre atelier d’Antananarivo avec les étoffes les plus précieuses.
  </p>
</div>
```
