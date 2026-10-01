import React, { useState } from 'react';
import { Search, X, ChevronDown, Check } from 'lucide-react';

/**
 * Exemple de référence pour les composants de formulaire ANGALY Haute Couture.
 * Conforme aux règles d'accessibilité WCAG, anneaux de focus or antique et typographie sans-serif Inter.
 */
export const CoutureFormExample: React.FC = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('robes');
  const [isAgreed, setIsAgreed] = useState(false);

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="max-w-xl space-y-5 rounded-sm border border-angaly-border bg-white p-6 shadow-xs"
    >
      {/* 1. Barre de recherche couture */}
      <div>
        <label
          htmlFor="search-creations"
          className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-angaly-slate"
        >
          Rechercher une création
        </label>
        <div className="relative">
          <Search
            className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-angaly-slate"
            aria-hidden="true"
          />
          <input
            id="search-creations"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ex: Soie sauvage, robe brodée..."
            className="h-10 w-full rounded-sm border border-angaly-border bg-white pl-10 pr-9 text-xs text-angaly-navy placeholder:text-angaly-warm-gray transition-colors focus:border-angaly-gold focus:outline-none focus:ring-1 focus:ring-angaly-gold"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Effacer la recherche"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-angaly-slate transition-colors hover:text-angaly-navy"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Menu déroulant stylisé */}
      <div>
        <label
          htmlFor="category-select"
          className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-angaly-slate"
        >
          Catégorie d'étoffe
        </label>
        <div className="relative">
          <select
            id="category-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-10 w-full appearance-none rounded-sm border border-angaly-border bg-white px-3.5 pr-9 text-xs text-angaly-navy transition-colors focus:border-angaly-gold focus:outline-none focus:ring-1 focus:ring-angaly-gold"
          >
            <option value="robes">Robes de Mariée & Réception</option>
            <option value="costumes">Costumes & Tailleurs Homme</option>
            <option value="soie">Soie Malgache & Velours</option>
            <option value="accessoires">Voiles & Accessoires d'Atelier</option>
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-angaly-slate"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* 3. Case à cocher accessible couture */}
      <div className="flex items-center gap-2.5 pt-1">
        <button
          type="button"
          role="checkbox"
          id="terms-checkbox"
          aria-checked={isAgreed}
          onClick={() => setIsAgreed(!isAgreed)}
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] border transition-colors ${
            isAgreed
              ? 'border-angaly-navy bg-angaly-navy text-white'
              : 'border-angaly-border bg-white hover:border-angaly-gold'
          }`}
        >
          {isAgreed && <Check className="h-3 w-3 stroke-[3]" />}
        </button>
        <label
          htmlFor="terms-checkbox"
          onClick={() => setIsAgreed(!isAgreed)}
          className="cursor-pointer text-xs text-angaly-slate"
        >
          Je souhaite recevoir le carnet des tendances couture par email
        </label>
      </div>

      {/* 4. Barre d'actions */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-angaly-border">
        <button
          type="button"
          onClick={() => {
            setSearch('');
            setIsAgreed(false);
          }}
          className="h-9 rounded-sm border border-angaly-border bg-white px-4 text-xs font-medium text-angaly-slate transition-colors hover:bg-angaly-ivory"
        >
          Réinitialiser
        </button>
        <button
          type="submit"
          className="h-9 rounded-sm bg-angaly-navy px-5 text-xs font-medium uppercase tracking-wider text-white shadow-xs transition-colors hover:bg-angaly-navy-blue"
        >
          Filtrer le catalogue
        </button>
      </div>
    </form>
  );
};
