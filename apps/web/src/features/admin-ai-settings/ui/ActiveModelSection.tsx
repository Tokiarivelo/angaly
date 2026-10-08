'use client';

import React from 'react';
import { Cpu, ShieldCheck, Zap } from 'lucide-react';
import { AiProviderId, type AiProviderCatalogEntry, type AiProviderConfigView, type AiRoutingSetting } from '@angaly/types';
import { useUpdateAiRouting } from '../hooks/useUpdateAiRouting';
import { moveFallback, toggleFallback, MAX_FALLBACKS } from '../utils/fallback-order';

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

  const fallbacks = routing?.patternSuggestionFallbacks ?? [];
  const nameOf = (id: AiProviderId) => catalog.find((c) => c.id === id)?.name ?? id;

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

      {/* Fallbacks for photo analysis */}
      <div className="mt-6 pt-5 border-t border-[#D9D4CA]/70 space-y-3" data-testid="fallback-section">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#061938]">
            Modèles de repli pour l&apos;analyse de photo
          </h3>
          <p className="text-[11px] text-[#5C697A] leading-relaxed mt-1">
            Si le modèle choisi échoue ou ne sait pas lire une photo (le modèle local ne lit que les mesures),
            ces modèles sont essayés dans l&apos;ordre. {MAX_FALLBACKS} au maximum.
          </p>
        </div>
        {patternOptions.length === 0 ? (
          <p className="text-[11px] text-[#8A877F]">Connectez d&apos;abord un fournisseur externe.</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {patternOptions.map((opt) => {
              const checked = fallbacks.includes(opt.id);
              const rank = fallbacks.indexOf(opt.id);
              return (
                <li
                  key={opt.id}
                  className="flex items-center justify-between gap-2 bg-[#F6F2E9]/60 border border-[#D9D4CA] rounded-sm px-3 py-2"
                >
                  <label className="flex items-center gap-2 text-xs text-[#061938] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={isLoading || updateRouting.isPending || (!checked && fallbacks.length >= MAX_FALLBACKS)}
                      onChange={() =>
                        updateRouting.mutate({ patternSuggestionFallbacks: toggleFallback(fallbacks, opt.id) })
                      }
                    />
                    <span>{opt.name}</span>
                    {checked && (
                      <span className="text-[10px] font-semibold text-[#936C3E]">#{rank + 1}</span>
                    )}
                  </label>
                  {checked && (
                    <span className="flex gap-1">
                      <button
                        type="button"
                        aria-label={`Monter ${opt.name}`}
                        disabled={rank === 0 || updateRouting.isPending}
                        onClick={() =>
                          updateRouting.mutate({ patternSuggestionFallbacks: moveFallback(fallbacks, opt.id, -1) })
                        }
                        className="px-1.5 text-xs text-[#5C697A] disabled:opacity-30"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        aria-label={`Descendre ${opt.name}`}
                        disabled={rank === fallbacks.length - 1 || updateRouting.isPending}
                        onClick={() =>
                          updateRouting.mutate({ patternSuggestionFallbacks: moveFallback(fallbacks, opt.id, 1) })
                        }
                        className="px-1.5 text-xs text-[#5C697A] disabled:opacity-30"
                      >
                        ▼
                      </button>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {fallbacks.length > 0 && (
          <p className="text-[11px] text-[#5C697A]">
            Ordre : {fallbacks.map(nameOf).join(' → ')}
          </p>
        )}
      </div>

      {/* Reassurance Footer */}
      <div className="mt-6 pt-4 border-t border-[#D9D4CA]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-[#5C697A]">
        <div className="flex items-center gap-2 text-[#46745A]">
          <ShieldCheck className="w-4 h-4 shrink-0 text-[#46745A]" />
          <span>
            <strong>Repli automatique :</strong> modèles de repli ci-dessus pour les photos ; modèle statistique local (ANSUR II) pour les mesures.
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
