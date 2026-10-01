import React from 'react';
import { Sparkles, Check } from 'lucide-react';

interface CoutureCardProps {
  title: string;
  category: string;
  price?: string;
  isSelected?: boolean;
  isDark?: boolean;
  onSelect?: () => void;
}

/**
 * Exemple de référence pour les cartes de l'écosystème ANGALY Haute Couture.
 * Conforme à la règle 60-25-10-5, bordures #D9D4CA et coins nets rounded-sm.
 */
export const CoutureCard: React.FC<CoutureCardProps> = ({
  title,
  category,
  price,
  isSelected = false,
  isDark = false,
  onSelect,
}) => {
  // Variante 1 : Carte sombre atelier / Pattern Studio
  if (isDark) {
    return (
      <div className="relative overflow-hidden rounded-sm border border-angaly-royal-navy bg-angaly-navy-blue p-6 text-white shadow-sm transition-all hover:border-angaly-champagne/50">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium uppercase tracking-widest text-angaly-champagne">
            {category}
          </span>
          <Sparkles className="h-4 w-4 text-angaly-gold" aria-hidden="true" />
        </div>

        <h3 className="mt-3 font-heading text-xl font-normal text-white">
          {title}
        </h3>

        {price && (
          <p className="mt-2 font-sans text-sm font-medium text-angaly-warm-ivory">
            {price}
          </p>
        )}

        <div className="mt-5 border-t border-angaly-royal-navy pt-4">
          <button
            type="button"
            className="w-full rounded-sm bg-angaly-gold px-4 py-2 text-xs font-medium uppercase tracking-wider text-white transition-colors hover:bg-angaly-gold-light"
          >
            Configurer le patron
          </button>
        </div>
      </div>
    );
  }

  // Variante 2 : Carte claire standard ou sélectionnée
  return (
    <div
      onClick={onSelect}
      className={`group relative cursor-pointer rounded-sm bg-white p-5 transition-all shadow-xs ${
        isSelected
          ? 'border-2 border-angaly-gold shadow-sm'
          : 'border border-angaly-border hover:border-angaly-slate/40 hover:shadow-xs'
      }`}
    >
      {/* Badge checkmark or en cas de sélection */}
      {isSelected && (
        <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-angaly-gold text-white shadow-xs">
          <Check className="h-3 w-3 stroke-[3]" aria-hidden="true" />
        </div>
      )}

      <span className="text-[10px] font-medium uppercase tracking-wider text-angaly-slate">
        {category}
      </span>

      <h3 className="mt-1 font-heading text-lg font-normal text-angaly-navy group-hover:text-angaly-soft-navy">
        {title}
      </h3>

      {price && (
        <p className="mt-2 font-sans text-xs font-semibold text-angaly-navy">
          {price}
        </p>
      )}
    </div>
  );
};
