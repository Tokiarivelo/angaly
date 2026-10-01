# Guide des Composants Couture — ANGALY Design System

Ce guide regroupe les spécifications des composants UI fondamentaux pour garantir la cohérence visuelle dans `apps/web`.

---

## 1. Boutons (`Button`)

Les boutons obéissent à des codes formels stricts : coins nets (`rounded-sm`), typographie aérée en capitales ou minuscules soignées, transitions douces.

```tsx
// 1. Bouton Primaire (Deep Navy) — L'action par excellence
<button className="h-10 px-5 bg-angaly-navy text-white text-xs uppercase tracking-wider font-medium rounded-sm hover:bg-angaly-navy-blue transition-colors shadow-sm disabled:opacity-50">
  Enregistrer les modifications
</button>

// 2. Bouton Secondaire / Contour — Action alternative élégante
<button className="h-10 px-5 border border-angaly-navy text-angaly-navy bg-transparent text-xs uppercase tracking-wider font-medium rounded-sm hover:bg-angaly-navy hover:text-white transition-colors">
  Aperçu en direct
</button>

// 3. Bouton Premium Atelier — Réservé au Pattern Studio et aux services exclusifs
<button className="h-10 px-6 bg-angaly-gold text-white text-xs uppercase tracking-widest font-medium rounded-sm hover:bg-angaly-gold-light transition-colors shadow-sm">
  Générer le patron sur mesure
</button>

// 4. Bouton Discret / Neutre
<button className="h-9 px-3.5 border border-angaly-border bg-white text-angaly-slate text-xs rounded-sm hover:bg-angaly-ivory transition-colors">
  Annuler
</button>

// 5. Bouton Destructif
<button className="h-9 px-3.5 border border-angaly-error/30 text-angaly-error bg-angaly-error/5 text-xs rounded-sm hover:bg-angaly-error hover:text-white transition-colors">
  Supprimer la création
</button>
```

---

## 2. Cartes & Surfaces de Contenu

### 2.1 Carte Blanche Standard
```tsx
<div className="bg-white border border-angaly-border rounded-sm p-5 shadow-xs transition-shadow hover:shadow-sm">
  <h3 className="font-heading text-lg text-angaly-navy mb-2">Titre de la section</h3>
  <p className="text-xs text-angaly-slate leading-relaxed">Description de la création ou du paramètre.</p>
</div>
```

### 2.2 Carte Active / Sélectionnée (Or Antique)
```tsx
<div className="bg-white border-2 border-angaly-gold rounded-sm p-5 shadow-sm relative">
  <div className="absolute top-2.5 right-2.5 w-5 h-5 bg-angaly-gold text-white rounded-full flex items-center justify-center text-[10px]">
    ✓
  </div>
  <h3 className="font-heading text-lg text-angaly-navy mb-1">Robe de Mariée Soie</h3>
  <span className="text-xs text-angaly-gold font-medium">Sélectionné</span>
</div>
```

### 2.3 Carte Sombre Privilège / Pattern Studio
```tsx
<div className="bg-angaly-navy-blue border border-angaly-royal-navy rounded-sm p-6 text-white relative overflow-hidden">
  <div className="absolute top-0 right-0 w-24 h-24 bg-angaly-royal-navy/20 rounded-full blur-xl pointer-events-none" />
  <span className="text-[10px] uppercase tracking-widest text-angaly-champagne">Atelier Digital</span>
  <h3 className="font-heading text-xl text-white mt-1">Patron Numérique 3D</h3>
</div>
```

---

## 3. Formulaires & Contrôles de Saisie

### 3.1 Champ Texte & Sélecteur
```tsx
<div>
  <label htmlFor="title" className="block text-xs font-medium uppercase tracking-wider text-angaly-slate mb-1.5">
    Titre de la création
  </label>
  <input
    id="title"
    type="text"
    placeholder="Ex: Robe Malgache Reine Ranavalona"
    className="w-full h-10 px-3.5 rounded-sm border border-angaly-border bg-white text-sm text-angaly-navy placeholder:text-angaly-warm-gray focus:border-angaly-gold focus:ring-1 focus:ring-angaly-gold focus:outline-none transition-colors"
  />
</div>
```

### 3.2 Barre de Recherche Haute Couture
```tsx
<div className="relative flex-1">
  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-angaly-slate" aria-hidden="true" />
  <input
    type="text"
    placeholder="Rechercher par nom, référence ou collection..."
    className="w-full h-10 pl-10 pr-9 rounded-sm border border-angaly-border bg-white text-xs md:text-sm text-angaly-navy placeholder:text-angaly-warm-gray focus:border-angaly-gold focus:ring-1 focus:ring-angaly-gold focus:outline-none transition-colors"
  />
  {query && (
    <button
      onClick={() => setQuery('')}
      aria-label="Effacer la recherche"
      className="absolute right-3 top-1/2 -translate-y-1/2 text-angaly-slate hover:text-angaly-navy"
    >
      <X className="h-3.5 w-3.5" />
    </button>
  )}
</div>
```

### 3.3 Case à Cocher Accessible Couture
```tsx
<button
  type="button"
  role="checkbox"
  aria-checked={isSelected}
  onClick={toggle}
  className={cn(
    'w-4 h-4 rounded-[2px] border transition-colors flex items-center justify-center',
    isSelected
      ? 'bg-angaly-navy border-angaly-navy text-white'
      : 'border-angaly-border bg-white hover:border-angaly-gold'
  )}
>
  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
</button>
```

---

## 4. Pastilles de Statut & Filtres (Chips)

### 4.1 Pastilles de Statut
- **Publié / Confirmé** :
  `bg-angaly-success/10 text-angaly-success border border-angaly-success/20 text-xs px-2.5 py-0.5 rounded-sm font-medium`
- **Brouillon / Attente** :
  `bg-angaly-slate/10 text-angaly-slate border border-angaly-slate/20 text-xs px-2.5 py-0.5 rounded-sm font-medium`
- **En Confection / Accent** :
  `bg-angaly-champagne/20 text-angaly-navy border border-angaly-champagne/40 text-xs px-2.5 py-0.5 rounded-sm font-medium`

### 4.2 Puces de Filtres Scrollables (Pill Switcher)
```tsx
<div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
  {folders.map((folder) => (
    <button
      key={folder.id}
      onClick={() => onSelect(folder.id)}
      className={cn(
        'px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border',
        current === folder.id
          ? 'bg-angaly-navy text-white border-angaly-navy shadow-xs'
          : 'bg-angaly-ivory/80 text-angaly-navy border-angaly-border hover:border-angaly-gold/60'
      )}
    >
      {folder.label}
    </button>
  ))}
</div>
```

---

## 5. Volet Latéral / Panneau de Détails (Drawer / Sheet)

Pour les interfaces de gestion (Médiathèque, Gestion de contenu, Fiche projet) :

```tsx
<aside
  aria-label="Détails de l'élément"
  className="w-full lg:w-96 shrink-0 bg-white border border-angaly-border rounded-sm shadow-xs flex flex-col h-full"
>
  {/* En-tête */}
  <div className="p-4 border-b border-angaly-border flex items-center justify-between">
    <h2 className="font-heading text-lg text-angaly-navy">Détails de la création</h2>
    <button onClick={onClose} aria-label="Fermer" className="text-angaly-slate hover:text-angaly-navy">
      <X className="h-4 w-4" />
    </button>
  </div>

  {/* Corps avec défilement */}
  <div className="p-5 flex-1 overflow-y-auto space-y-6">
    ...
  </div>

  {/* Pied d'action sticky */}
  <div className="p-4 bg-angaly-ivory/50 border-t border-angaly-border flex items-center justify-end gap-2">
    <button className="px-4 py-2 border border-angaly-border bg-white text-xs rounded-sm hover:bg-angaly-ivory">
      Annuler
    </button>
    <button className="px-4 py-2 bg-angaly-navy text-white text-xs rounded-sm hover:bg-angaly-navy-blue">
      Enregistrer
    </button>
  </div>
</aside>
```
