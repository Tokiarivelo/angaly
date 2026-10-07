'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  Eye,
  EyeOff,
  Lock,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Globe,
} from 'lucide-react';
import {
  AiProviderId,
  AiProviderStatus,
  type AiProviderCatalogEntry,
  type AiProviderConfigView,
  type TestAiProviderResponse,
} from '@angaly/types';
import { PROVIDER_VISUAL_MAP } from '../consts/ai-providers.consts';
import { useUpsertAiProvider } from '../hooks/useUpsertAiProvider';
import { useTestAiProvider } from '../hooks/useTestAiProvider';
import { useAiProviderModels } from '../hooks/useAiProviderModels';
import { ModelCombobox } from './ModelCombobox';

interface ConnectProviderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  providerId: AiProviderId | null;
  catalog: AiProviderCatalogEntry[];
  providers: AiProviderConfigView[];
}

export const ConnectProviderDrawer: React.FC<ConnectProviderDrawerProps> = ({
  isOpen,
  onClose,
  providerId,
  catalog,
  providers,
}) => {
  const upsertMutation = useUpsertAiProvider();
  const testMutation = useTestAiProvider();

  const [model, setModel] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [baseUrl, setBaseUrl] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<TestAiProviderResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const catalogEntry = catalog.find((c) => c.id === providerId);
  const existingConfig = providers.find((p) => p.provider === providerId);

  // Synchronize form when selected provider changes
  useEffect(() => {
    if (providerId && catalogEntry) {
      setModel(existingConfig?.model || catalogEntry.defaultModel || '');
      setBaseUrl(existingConfig?.baseUrl || catalogEntry.defaultBaseUrl || '');
      setApiKey('');
      setShowApiKey(false);
      setTestResult(null);
      setErrorMessage(null);
    }
  }, [providerId, catalogEntry, existingConfig]);

  // Models are listed with the stored key once the connection test has succeeded.
  const isConnectionVerified =
    testResult?.status === AiProviderStatus.OK ||
    (testResult === null && existingConfig?.status === AiProviderStatus.OK);
  const modelsQuery = useAiProviderModels(
    providerId,
    model,
    isOpen && isConnectionVerified,
  );

  if (!isOpen || !providerId || !catalogEntry) {
    return null;
  }

  const visual = PROVIDER_VISUAL_MAP[providerId] || {
    monogram: providerId.slice(0, 2).toUpperCase(),
    bgClass: 'bg-[#061938]',
    textClass: 'text-[#FFFFFF]',
    borderClass: 'border-[#D9D4CA]',
  };

  const handleTestConnection = async () => {
    setErrorMessage(null);
    try {
      // First save if needed or test directly
      const result = await testMutation.mutateAsync(providerId);
      setTestResult(result);
    } catch (err: any) {
      setTestResult({
        provider: providerId,
        status: AiProviderStatus.INVALID,
        latencyMs: 0,
        testedAt: new Date().toISOString(),
        message: err.message || 'Échec du test de connexion.',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!model.trim()) {
      setErrorMessage('Veuillez renseigner un identifiant de modèle.');
      return;
    }

    if (catalogEntry.requiresApiKey && !existingConfig && !apiKey.trim()) {
      setErrorMessage('Une clé API est requise pour ce fournisseur.');
      return;
    }

    try {
      const dto: {
        model: string;
        enabled: boolean;
        apiKey?: string | undefined;
        baseUrl?: string | null | undefined;
      } = {
        model: model.trim(),
        baseUrl: baseUrl.trim() ? baseUrl.trim() : null,
        enabled: true,
      };
      if (apiKey.trim()) {
        dto.apiKey = apiKey.trim();
      }

      await upsertMutation.mutateAsync({
        provider: providerId,
        dto,
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Erreur lors de l'enregistrement du fournisseur.");
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
      className="fixed inset-0 z-50 overflow-hidden"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#061938]/60 transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-lg bg-[#F6F2E9] border-l border-[#D9D4CA] shadow-2xl flex flex-col justify-between relative z-10">
          {/* Drawer Header */}
          <div className="p-6 pb-5 border-b border-[#D9D4CA] bg-[#F6F2E9]">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="block text-[11px] tracking-widest text-[#936C3E] uppercase font-medium">
                  Configuration Fournisseur
                </span>
                <h2
                  id="drawer-title"
                  className="font-heading text-2xl text-[#061938] font-normal leading-snug"
                >
                  Connecter {catalogEntry.name}
                </h2>
                <p className="text-xs text-[#5C697A]">
                  Fournisseur d&apos;IA pour l&apos;Atelier Haute Couture ANGALY
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="p-1.5 text-[#5C697A] hover:text-[#061938] rounded-sm transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Drawer Form Body */}
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Status Banner Card if already configured */}
              {existingConfig && (
                <div className="p-4 bg-white border border-[#D9D4CA] rounded-sm flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-9 h-9 rounded-full ${visual.bgClass} ${visual.textClass} border ${visual.borderClass} flex items-center justify-center font-serif text-xs font-semibold shrink-0`}
                    >
                      {visual.monogram}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-semibold text-[#061938] uppercase tracking-wider">
                          {catalogEntry.name}
                        </h3>
                        {existingConfig.status === AiProviderStatus.OK ? (
                          <span className="px-2 py-0.5 bg-[#46745A]/10 text-[#46745A] border border-[#46745A]/20 rounded-sm text-[10px] uppercase font-semibold">
                            Connecté
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-[#5C697A]/10 text-[#5C697A] border border-[#5C697A]/20 rounded-sm text-[10px] uppercase font-semibold">
                            Non testé
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#5C697A] mt-0.5">
                        {catalogEntry.description}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error banner */}
              {errorMessage && (
                <div className="p-3 bg-[#A64A43]/10 border border-[#A64A43]/30 text-[#A64A43] text-xs rounded-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Model Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="drawer-model-input"
                    className="block text-xs font-semibold text-[#061938] uppercase tracking-wider"
                  >
                    Modèle sélectionné <span className="text-[#A64A43]">*</span>
                  </label>
                  <span className="text-[11px] text-[#8A877F] uppercase tracking-wide">
                    Identifiant technique
                  </span>
                </div>

                <ModelCombobox
                  id="drawer-model-input"
                  value={model}
                  onChange={setModel}
                  options={(modelsQuery.data?.models ?? []).map((m) => m.id)}
                  placeholder={catalogEntry.defaultModel}
                  isLoading={isConnectionVerified && modelsQuery.isSearching}
                  hint={
                    !isConnectionVerified
                      ? 'Testez la connexion pour lister les modèles disponibles.'
                      : modelsQuery.data?.message
                  }
                />

                {/* Suggested models chips */}
                {catalogEntry.suggestedModels.length > 0 && (
                  <div className="pt-1 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] uppercase text-[#8A877F] font-medium mr-1">
                      Suggestions :
                    </span>
                    {catalogEntry.suggestedModels.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setModel(m)}
                        className={`px-2 py-0.5 text-[10px] font-mono rounded-sm border transition-colors ${
                          model === m
                            ? 'bg-[#061938] text-white border-[#061938]'
                            : 'bg-white text-[#5C697A] border-[#D9D4CA] hover:border-[#061938]'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-[11px] text-[#5C697A] leading-relaxed pt-0.5">
                  Le modèle sélectionné exécutera les inférences JSON structurées pour les usages d&apos;Atelier.
                </p>
              </div>

              {/* API Key Input (if required) */}
              {catalogEntry.requiresApiKey && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="drawer-api-key"
                      className="block text-xs font-semibold text-[#061938] uppercase tracking-wider"
                    >
                      Clé API {catalogEntry.name}{' '}
                      {!existingConfig && <span className="text-[#A64A43]">*</span>}
                    </label>
                    <span className="text-[11px] text-[#8A877F] uppercase tracking-wide">
                      {existingConfig?.apiKeyMasked || 'Non enregistrée'}
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      id="drawer-api-key"
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={
                        existingConfig?.apiKeyMasked
                          ? `${existingConfig.apiKeyMasked} (laisser vide pour conserver)`
                          : 'Collez votre clé API secrète...'
                      }
                      className="w-full bg-white border border-[#D9D4CA] focus:border-[#061938] text-xs font-mono text-[#061938] py-2.5 pl-3 pr-10 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#061938] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-2.5 top-2 text-[#5C697A] hover:text-[#061938] p-1 transition-colors"
                      title={showApiKey ? 'Masquer la clé' : 'Afficher la clé'}
                    >
                      {showApiKey ? (
                        <EyeOff className="w-4 h-4 text-[#5C697A]" />
                      ) : (
                        <Eye className="w-4 h-4 text-[#5C697A]" />
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-[#5C697A] flex items-center gap-1.5 pt-0.5">
                    <Lock className="w-3.5 h-3.5 text-[#936C3E] shrink-0" />
                    <span>
                      Chiffrée avec AES-256-GCM avant enregistrement — jamais réaffichée en clair.
                    </span>
                  </p>
                </div>
              )}

              {/* Base URL Input (if required or custom) */}
              {(catalogEntry.requiresBaseUrl || catalogEntry.defaultBaseUrl) && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="drawer-base-url"
                      className="block text-xs font-semibold text-[#061938] uppercase tracking-wider"
                    >
                      URL de base (Endpoint compatible OpenAI){' '}
                      {catalogEntry.requiresBaseUrl && <span className="text-[#A64A43]">*</span>}
                    </label>
                    <Globe className="w-3.5 h-3.5 text-[#8A877F]" />
                  </div>

                  <input
                    id="drawer-base-url"
                    type="url"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder={catalogEntry.defaultBaseUrl || 'https://api.../v1'}
                    className="w-full bg-white border border-[#D9D4CA] focus:border-[#061938] text-xs font-mono text-[#061938] py-2.5 px-3 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#061938] transition-colors"
                  />
                  <p className="text-[11px] text-[#5C697A]">
                    Obligatoirement en HTTPS (sauf localhost en environnement de test/développement). Protection SSRF active.
                  </p>
                </div>
              )}

              {/* Connection Test & Diagnostic Card */}
              {existingConfig && (
                <div className="p-4 bg-white border border-[#D9D4CA] rounded-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={testMutation.isPending}
                      className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#061938] hover:bg-[#061938] hover:text-white text-[#061938] rounded-sm text-xs font-medium tracking-wider uppercase transition-colors disabled:opacity-50"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${testMutation.isPending ? 'animate-spin text-[#936C3E]' : ''}`}
                      />
                      <span>{testMutation.isPending ? 'Test en cours...' : 'Tester la connexion'}</span>
                    </button>
                    {existingConfig.lastTestedAt && (
                      <span className="text-[11px] text-[#8A877F]">
                        Dernier test : {new Date(existingConfig.lastTestedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>

                  {testResult && (
                    <div
                      className={`flex items-start gap-2 text-xs font-medium pt-2 border-t border-[#D9D4CA]/60 ${
                        testResult.status === AiProviderStatus.OK ? 'text-[#46745A]' : 'text-[#A64A43]'
                      }`}
                    >
                      {testResult.status === AiProviderStatus.OK ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-[#46745A] mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0 text-[#A64A43] mt-0.5" />
                      )}
                      <div>
                        <span>{testResult.message}</span>
                        {testResult.latencyMs > 0 && (
                          <span className="block text-[11px] text-[#5C697A] font-normal mt-0.5">
                            Latence mesurée : {testResult.latencyMs} ms
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Drawer Footer Buttons */}
            <div className="border-t border-[#D9D4CA] p-6 bg-[#F6F2E9] flex items-center justify-between gap-4 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="text-xs tracking-wider uppercase font-medium text-[#5C697A] hover:text-[#061938] px-4 py-2.5 transition-colors"
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={upsertMutation.isPending}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#061938] hover:bg-[#0C2650] text-[#FFFFFF] border border-[#061938] rounded-sm text-xs font-semibold tracking-widest uppercase transition-colors shadow-sm disabled:opacity-50"
              >
                {upsertMutation.isPending && <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#C5B190]" />}
                <span>Enregistrer le fournisseur</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
