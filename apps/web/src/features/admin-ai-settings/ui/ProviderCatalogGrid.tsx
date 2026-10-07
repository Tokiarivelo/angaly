'use client';

import React, { useState } from 'react';
import { Check } from 'lucide-react';
import {
  AiProviderBillingTier,
  AiProviderId,
  type AiProviderCatalogEntry,
  type AiProviderConfigView,
} from '@angaly/types';
import { PROVIDER_VISUAL_MAP } from '../consts/ai-providers.consts';

interface ProviderCatalogGridProps {
  catalog: AiProviderCatalogEntry[];
  providers: AiProviderConfigView[];
  onSelectProvider: (providerId: AiProviderId) => void;
}

type FilterCategory = 'ALL' | 'FREE' | 'PAID' | 'SELF_HOSTED';

export const ProviderCatalogGrid: React.FC<ProviderCatalogGridProps> = ({
  catalog,
  providers,
  onSelectProvider,
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('ALL');

  const configuredMap = new Map(providers.map((p) => [p.provider, p]));

  const filteredCatalog = catalog.filter((entry) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'FREE') {
      return entry.tier === AiProviderBillingTier.FREE || entry.tier === AiProviderBillingTier.FREEMIUM;
    }
    if (activeFilter === 'PAID') {
      return entry.tier === AiProviderBillingTier.PAID;
    }
    if (activeFilter === 'SELF_HOSTED') {
      return entry.tier === AiProviderBillingTier.SELF_HOSTED || entry.isSelfHosted;
    }
    return true;
  });

  return (
    <section className="space-y-4">
      {/* Title & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#D9D4CA]">
        <div>
          <h2 className="font-heading text-xl text-[#061938] font-normal leading-tight">
            Catalogue de fournisseurs
          </h2>
          <p className="text-xs text-[#5C697A] mt-0.5">
            Explorez et connectez de nouvelles passerelles LLM pour enrichir les capacités de votre Atelier.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-[#F6F2E9] border border-[#D9D4CA] rounded-sm self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1 text-[11px] font-medium tracking-wider uppercase rounded-sm transition-colors ${
              activeFilter === 'ALL'
                ? 'bg-[#061938] text-[#FFFFFF] shadow-sm'
                : 'text-[#5C697A] hover:text-[#061938]'
            }`}
          >
            Tous
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('FREE')}
            className={`px-3 py-1 text-[11px] font-medium tracking-wider uppercase rounded-sm transition-colors ${
              activeFilter === 'FREE'
                ? 'bg-[#061938] text-[#FFFFFF] shadow-sm'
                : 'text-[#5C697A] hover:text-[#061938]'
            }`}
          >
            Gratuit
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('PAID')}
            className={`px-3 py-1 text-[11px] font-medium tracking-wider uppercase rounded-sm transition-colors ${
              activeFilter === 'PAID'
                ? 'bg-[#061938] text-[#FFFFFF] shadow-sm'
                : 'text-[#5C697A] hover:text-[#061938]'
            }`}
          >
            Payant
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('SELF_HOSTED')}
            className={`px-3 py-1 text-[11px] font-medium tracking-wider uppercase rounded-sm transition-colors ${
              activeFilter === 'SELF_HOSTED'
                ? 'bg-[#061938] text-[#FFFFFF] shadow-sm'
                : 'text-[#5C697A] hover:text-[#061938]'
            }`}
          >
            Auto-hébergé
          </button>
        </div>
      </div>

      {/* Grid of Catalog Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filteredCatalog.map((entry) => {
          const isConfigured = configuredMap.has(entry.id);
          const visual = PROVIDER_VISUAL_MAP[entry.id] || {
            monogram: entry.id.slice(0, 2).toUpperCase(),
            bgClass: 'bg-[#061938]',
            textClass: 'text-[#FFFFFF]',
            borderClass: 'border-[#D9D4CA]',
          };

          return (
            <div
              key={entry.id}
              className={`bg-white border p-4 rounded-sm flex flex-col justify-between transition-colors shadow-sm ${
                isConfigured
                  ? 'border-[#C5B190]/60 bg-gradient-to-b from-white to-[#F6F2E9]/30'
                  : 'border-[#D9D4CA] hover:border-[#061938]'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-full ${visual.bgClass} ${visual.textClass} border ${visual.borderClass} flex items-center justify-center font-serif text-xs font-semibold shrink-0`}
                    >
                      {visual.monogram}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-[#061938] leading-tight">
                        {entry.name}
                      </h4>
                      <span className="text-[10px] text-[#8A877F] uppercase tracking-wider block mt-0.5">
                        {entry.tierLabel}
                      </span>
                    </div>
                  </div>

                  {isConfigured && (
                    <span className="px-1.5 py-0.5 bg-[#46745A]/10 text-[#46745A] border border-[#46745A]/20 text-[9px] uppercase font-semibold rounded-sm flex items-center gap-0.5">
                      <Check className="w-2.5 h-2.5" />
                      Actif
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-[#5C697A] leading-relaxed mb-3 line-clamp-2">
                  {entry.description}
                </p>
              </div>

              <div>
                <div className="pt-2 border-t border-[#D9D4CA]/50 mb-3 flex items-center justify-between text-[10px] text-[#8A877F]">
                  <span>Défaut :</span>
                  <code className="font-mono text-[10px] text-[#061938] font-medium">
                    {entry.defaultModel}
                  </code>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectProvider(entry.id)}
                  className={`w-full py-1.5 text-[11px] font-medium tracking-wider uppercase rounded-sm transition-colors border ${
                    isConfigured
                      ? 'border-[#061938] bg-transparent text-[#061938] hover:bg-[#061938] hover:text-[#FFFFFF]'
                      : 'border-[#061938] bg-[#061938] text-[#FFFFFF] hover:bg-[#0C2650]'
                  }`}
                >
                  {isConfigured
                    ? 'Modifier'
                    : entry.id === AiProviderId.CUSTOM_OPENAI
                    ? "Configurer l'hôte local"
                    : 'Connecter'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
