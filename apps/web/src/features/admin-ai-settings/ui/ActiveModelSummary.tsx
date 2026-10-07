'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';
import {
  AiProviderId,
  type AiProviderCatalogEntry,
  type AiProviderConfigView,
  type AiRoutingSetting,
} from '@angaly/types';
import { PROVIDER_VISUAL_MAP } from '../consts/ai-providers.consts';

interface ActiveModelSummaryProps {
  routing?: AiRoutingSetting | undefined;
  catalog: AiProviderCatalogEntry[];
  providers: AiProviderConfigView[];
}

export const ActiveModelSummary: React.FC<ActiveModelSummaryProps> = ({
  routing,
  catalog,
  providers,
}) => {
  const activeProviderId = routing?.measurementProvider || AiProviderId.GEMINI;
  const catalogEntry = catalog.find((c) => c.id === activeProviderId);
  const config = providers.find((p) => p.provider === activeProviderId);

  const visual = PROVIDER_VISUAL_MAP[activeProviderId] || {
    monogram: activeProviderId.slice(0, 2).toUpperCase(),
    bgClass: 'bg-[#061938]',
    textClass: 'text-[#FFFFFF]',
    borderClass: 'border-[#D9D4CA]',
  };

  const modelName = config?.model || catalogEntry?.defaultModel || 'gemini-2.5-flash';

  const formatLatency = (ms: number | null | undefined) => {
    if (ms === null || ms === undefined) return 'Non mesurée';
    if (ms >= 1000) {
      return `${(ms / 1000).toFixed(1).replace('.', ',')} s`;
    }
    return `${ms} ms`;
  };

  const lastUpdateFormatted = routing?.updatedAt
    ? new Date(routing.updatedAt).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Récemment';

  return (
    <div className="bg-white border border-[#D9D4CA] rounded-sm p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between pb-4 border-b border-[#D9D4CA] gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full ${visual.bgClass} ${visual.textClass} flex items-center justify-center font-serif text-sm font-semibold tracking-wider border ${visual.borderClass} shrink-0`}
          >
            {visual.monogram}
          </div>
          <div>
            <h3 className="font-heading text-lg font-normal text-[#061938] leading-tight">
              {catalogEntry?.name || activeProviderId}
            </h3>
            <code className="font-mono text-xs text-[#5C697A] block mt-0.5">
              {modelName}
            </code>
          </div>
        </div>
        <span className="px-2.5 py-0.5 bg-[#936C3E]/10 text-[#936C3E] border border-[#936C3E]/30 text-[10px] uppercase font-semibold tracking-wider rounded-sm shrink-0">
          En service
        </span>
      </div>

      {/* Main Assignment */}
      <div className="py-4 border-b border-[#D9D4CA] space-y-2">
        <span className="text-[11px] uppercase tracking-wider font-semibold text-[#5C697A] block">
          Affectation principale
        </span>
        <p className="text-xs text-[#061938] font-medium leading-relaxed">
          En service pour l&apos;estimation morphologique et l&apos;assistance stylistique de l&apos;Atelier Haute Couture.
        </p>
        <p className="text-[11px] text-[#8A877F] italic pt-1">
          Dernière modification : {lastUpdateFormatted} par Admin
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="py-4 border-b border-[#D9D4CA] grid grid-cols-2 divide-x divide-[#D9D4CA]">
        <div className="pr-4">
          <span className="block text-[10px] uppercase tracking-wider text-[#8A877F]">
            Latence mesurée
          </span>
          <span className="font-heading text-2xl text-[#061938] font-medium tracking-tight block mt-0.5">
            {formatLatency(config?.lastLatencyMs)}
          </span>
          <span className="block text-[10px] text-[#46745A] font-medium mt-0.5">
            {config?.lastLatencyMs !== null && config?.lastLatencyMs !== undefined
              ? config.lastLatencyMs < 2000
                ? 'Optimale'
                : 'Tolérable'
              : 'En attente de test'}
          </span>
        </div>

        <div className="pl-4">
          <span className="block text-[10px] uppercase tracking-wider text-[#8A877F]">
            Offre fournisseur
          </span>
          <span className="font-heading text-xl text-[#061938] font-medium tracking-tight block mt-0.5">
            {catalogEntry?.tierLabel || 'Standard'}
          </span>
          <span className="block text-[10px] text-[#5C697A] mt-0.5">
            {catalogEntry?.requiresApiKey ? 'Clé requise' : 'Sans clé requise'}
          </span>
        </div>
      </div>

      {/* Ethical Safeguard Note */}
      <div className="mt-4 p-3.5 bg-[#F6F2E9]/70 border border-[#D9D4CA] rounded-sm flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-[#936C3E] shrink-0 mt-0.5" />
        <p className="text-xs text-[#5C697A] leading-relaxed">
          <strong className="font-medium text-[#061938]">Règle déontologique :</strong> Une estimation d&apos;intelligence artificielle demeure toujours indicative et strictement soumise à validation humaine lors du premier essayage en atelier.
        </p>
      </div>
    </div>
  );
};
