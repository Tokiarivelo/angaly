'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, RefreshCw, Settings, Trash2, Key, Activity } from 'lucide-react';
import {
  AiProviderId,
  AiProviderStatus,
  type AiProviderCatalogEntry,
  type AiProviderConfigView,
  type AiRoutingSetting,
} from '@angaly/types';
import { PROVIDER_VISUAL_MAP } from '../consts/ai-providers.consts';
import { useTestAiProvider } from '../hooks/useTestAiProvider';
import { useRemoveAiProvider } from '../hooks/useRemoveAiProvider';

interface ConnectedProviderCardProps {
  config: AiProviderConfigView;
  catalogEntry?: AiProviderCatalogEntry | undefined;
  routing?: AiRoutingSetting | undefined;
  onEdit: (provider: AiProviderId) => void;
}

export const ConnectedProviderCard: React.FC<ConnectedProviderCardProps> = ({
  config,
  catalogEntry,
  routing,
  onEdit,
}) => {
  const testMutation = useTestAiProvider();
  const removeMutation = useRemoveAiProvider();

  const visual = PROVIDER_VISUAL_MAP[config.provider] || {
    monogram: config.provider.slice(0, 2).toUpperCase(),
    bgClass: 'bg-[#061938]',
    textClass: 'text-[#FFFFFF]',
    borderClass: 'border-[#D9D4CA]',
  };

  const isLocal = config.provider === AiProviderId.LOCAL_STATISTICAL;
  const isEnService =
    routing?.measurementProvider === config.provider ||
    routing?.patternSuggestionProvider === config.provider;

  const handleTest = (e: React.MouseEvent) => {
    e.stopPropagation();
    testMutation.mutate(config.provider);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Êtes-vous sûr de vouloir supprimer la configuration de ${catalogEntry?.name || config.provider} ?`)) {
      removeMutation.mutate(config.provider);
    }
  };

  return (
    <div className="bg-white border border-[#D9D4CA] rounded-sm p-5 shadow-sm hover:border-[#061938]/40 transition-colors flex flex-col justify-between">
      <div>
        {/* Header: Monogram, Name & Status Pills */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#D9D4CA]/60">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-full ${visual.bgClass} ${visual.textClass} border ${visual.borderClass} flex items-center justify-center font-serif text-xs font-semibold tracking-wider shrink-0`}
            >
              {visual.monogram}
            </div>
            <div>
              <h3 className="font-heading text-base text-[#061938] font-normal leading-tight">
                {catalogEntry?.name || config.provider}
              </h3>
              <span className="text-[10px] text-[#8A877F] uppercase tracking-wider block mt-0.5">
                {catalogEntry?.tierLabel || 'Connecté'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {isEnService && (
              <span className="px-2 py-0.5 bg-[#936C3E]/10 text-[#936C3E] border border-[#936C3E]/30 text-[10px] uppercase font-semibold tracking-wider rounded-sm">
                En service
              </span>
            )}
            {config.status === AiProviderStatus.OK ? (
              <span className="px-2 py-0.5 bg-[#46745A]/10 text-[#46745A] border border-[#46745A]/20 text-[10px] uppercase font-semibold tracking-wider rounded-sm flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-[#46745A]" />
                Connecté
              </span>
            ) : config.status === AiProviderStatus.INVALID ? (
              <span className="px-2 py-0.5 bg-[#A64A43]/10 text-[#A64A43] border border-[#A64A43]/20 text-[10px] uppercase font-semibold tracking-wider rounded-sm flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-[#A64A43]" />
                Clé invalide
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-[#5C697A]/10 text-[#5C697A] border border-[#5C697A]/20 text-[10px] uppercase font-semibold tracking-wider rounded-sm">
                Non testé
              </span>
            )}
          </div>
        </div>

        {/* Details: Model, Masked Key, Latency */}
        <div className="py-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#8A877F] text-[11px] uppercase tracking-wider">Modèle ciblé :</span>
            <code className="font-mono text-xs text-[#061938] bg-[#F6F2E9] px-2 py-0.5 rounded-sm border border-[#D9D4CA]/50">
              {config.model}
            </code>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#8A877F] text-[11px] uppercase tracking-wider flex items-center gap-1">
              <Key className="w-3 h-3 text-[#8A877F]" />
              Clé d&apos;accès :
            </span>
            <span className="font-mono text-[11px] text-[#5C697A]">
              {config.apiKeyMasked || (isLocal ? 'Aucune clé requise' : 'Non renseignée')}
            </span>
          </div>

          {config.lastLatencyMs !== null && (
            <div className="flex items-center justify-between pt-1 border-t border-[#D9D4CA]/40">
              <span className="text-[#8A877F] text-[11px] uppercase tracking-wider flex items-center gap-1">
                <Activity className="w-3 h-3 text-[#936C3E]" />
                Dernière latence :
              </span>
              <span className="text-[11px] font-medium text-[#46745A]">
                {config.lastLatencyMs} ms
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Actions toolbar */}
      <div className="pt-3 border-t border-[#D9D4CA] flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleTest}
          disabled={testMutation.isPending}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#D9D4CA] hover:border-[#061938] text-[#061938] hover:bg-[#F6F2E9] rounded-sm text-[11px] font-medium tracking-wider uppercase transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${testMutation.isPending ? 'animate-spin text-[#936C3E]' : ''}`} />
          <span>{testMutation.isPending ? 'Test...' : 'Tester'}</span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onEdit(config.provider)}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#061938] hover:bg-[#0C2650] text-[#FFFFFF] rounded-sm text-[11px] font-semibold tracking-wider uppercase transition-colors"
          >
            <Settings className="w-3 h-3 text-[#C5B190]" />
            <span>Modifier</span>
          </button>

          {!isLocal && !isEnService && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={removeMutation.isPending}
              title="Supprimer la configuration"
              className="p-1.5 text-[#5C697A] hover:text-[#A64A43] hover:bg-[#A64A43]/10 rounded-sm transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
