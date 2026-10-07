'use client';

import React from 'react';
import { Cpu, ShieldCheck, Zap } from 'lucide-react';
import { AiProviderId, type AiProviderCatalogEntry, type AiProviderConfigView, type AiRoutingSetting } from '@angaly/types';
import { useUpdateAiRouting } from '../hooks/useUpdateAiRouting';

interface ActiveModelSectionProps {
  routing?: AiRoutingSetting | undefined;
  catalog: AiProviderCatalogEntry[];
  providers: AiProviderConfigView[];
  isLoading?: boolean | undefined;
}

export const ActiveModelSection: React.FC<ActiveModelSectionProps> = ({
  routing,
  catalog,
  providers,
  isLoading = false,
}) => {
  const updateRouting = useUpdateAiRouting();

  // Determine which providers are configured and usable
  const configuredProviderIds = new Set(providers.filter((p) => p.enabled).map((p) => p.provider));

  // Options for measurement estimation (includes LOCAL_STATISTICAL by definition)
  const measurementOptions = catalog.filter(
    (c) => c.id === AiProviderId.LOCAL_STATISTICAL || configuredProviderIds.has(c.id),
  );

  // Options for pattern suggestion (excludes LOCAL_STATISTICAL because it only computes measurements)
  const patternOptions = catalog.filter(
    (c) => c.id !== AiProviderId.LOCAL_STATISTICAL && configuredProviderIds.has(c.id),
  );

  const handleMeasurementChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as AiProviderId;
    updateRouting.mutate({ measurementProvider: val });
  };

  const handlePatternChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as AiProviderId;
    updateRouting.mutate({ patternSuggestionProvider: val });
  };

  return (
    <section className="bg-white border border-[#D9D4CA] rounded-sm p-6 shadow-sm relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#D9D4CA] gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-sm bg-[#061938] flex items-center justify-center text-[#F6F2E9]">
            <Cpu className="w-4 h-4 text-[#C5B190]" />
          </div>
          <div>
            <h2 className="font-heading text-xl text-[#061938] font-normal leading-tight">
              Modèle actif par usage
            </h2>
            <p className="text-xs text-[#5C697A] mt-0.5">
              Affectation dynamique des moteurs d&apos;intelligence artificielle aux étapes de l&apos;Atelier.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-[#061938] text-[#FFFFFF] text-[10px] tracking-widest uppercase font-semibold rounded-sm">
            Configuration directe
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
        {/* Usage 1: Estimation des mesures manquantes */}
        <div className="space-y-2">
          <label
            htmlFor="measurement-provider-select"
            className="block text-xs font-semibold uppercase tracking-wider text-[#061938]"
          >
            Estimation des mesures manquantes
          </label>
          <div className="relative">
            <select
              id="measurement-provider-select"
              value={routing?.measurementProvider ?? AiProviderId.GEMINI}
              onChange={handleMeasurementChange}
              disabled={isLoading || updateRouting.isPending}
              className="w-full bg-[#F6F2E9]/60 border border-[#D9D4CA] focus:border-[#061938] text-xs font-body text-[#061938] py-2.5 px-3 rounded-sm pr-9 appearance-none focus:outline-none focus:ring-1 focus:ring-[#061938] transition-colors cursor-pointer disabled:opacity-50"
            >
              {measurementOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name} ({opt.tierLabel})
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-3 pointer-events-none text-[#5C697A]">
              ▼
            </div>
          </div>
          <p className="text-[11px] text-[#5C697A] leading-relaxed">
            Fournisseur sollicité pour déduire les points anatomiques manquants selon les proportions du vêtement.
          </p>
        </div>

        {/* Usage 2: Suggestion de coupe et détails */}
        <div className="space-y-2">
          <label
            htmlFor="pattern-provider-select"
            className="block text-xs font-semibold uppercase tracking-wider text-[#061938]"
          >
            Suggestion de coupe et détails
          </label>
          <div className="relative">
            <select
              id="pattern-provider-select"
              value={routing?.patternSuggestionProvider ?? AiProviderId.GEMINI}
              onChange={handlePatternChange}
              disabled={isLoading || updateRouting.isPending}
              className="w-full bg-[#F6F2E9]/60 border border-[#D9D4CA] focus:border-[#061938] text-xs font-body text-[#061938] py-2.5 px-3 rounded-sm pr-9 appearance-none focus:outline-none focus:ring-1 focus:ring-[#061938] transition-colors cursor-pointer disabled:opacity-50"
            >
              {patternOptions.length === 0 ? (
                <option value={AiProviderId.GEMINI}>Google Gemini (Défaut Atelier)</option>
              ) : (
                patternOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name} ({opt.tierLabel})
                  </option>
                ))
              )}
            </select>
            <div className="absolute right-3 top-3 pointer-events-none text-[#5C697A]">
              ▼
            </div>
          </div>
          <p className="text-[11px] text-[#5C697A] leading-relaxed">
            Modèle de langage analysant le style et l&apos;occasion pour recommander l&apos;aisance et les finitions.
          </p>
        </div>
      </div>

      {/* Reassurance Footer */}
      <div className="mt-6 pt-4 border-t border-[#D9D4CA]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-[#5C697A]">
        <div className="flex items-center gap-2 text-[#46745A]">
          <ShieldCheck className="w-4 h-4 shrink-0 text-[#46745A]" />
          <span>
            <strong>Repli automatique :</strong> Modèle statistique local (ANSUR II) si l&apos;API distante est indisponible.
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[#8A877F] shrink-0">
          <Zap className="w-3.5 h-3.5 text-[#936C3E]" />
          <span>Tolérance latence : 3500ms</span>
        </div>
      </div>
    </section>
  );
};
