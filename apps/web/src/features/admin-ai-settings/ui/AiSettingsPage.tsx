'use client';

import React, { useState } from 'react';
import { Plus, RefreshCw, Layers } from 'lucide-react';
import { AiProviderId } from '@angaly/types';
import { useAiProviders } from '../hooks/useAiProviders';
import { useAiRouting } from '../hooks/useAiRouting';
import { ActiveModelSection } from './ActiveModelSection';
import { ConnectedProviderCard } from './ConnectedProviderCard';
import { ProviderCatalogGrid } from './ProviderCatalogGrid';
import { ActiveModelSummary } from './ActiveModelSummary';
import { EngineGuaranteeBanner } from './EngineGuaranteeBanner';
import { ConnectProviderDrawer } from './ConnectProviderDrawer';

export const AiSettingsPage: React.FC = () => {
  const { data: providersData, isLoading: isLoadingProviders, refetch: refetchProviders } = useAiProviders();
  const { data: routingData, isLoading: isLoadingRouting } = useAiRouting();

  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [selectedProviderId, setSelectedProviderId] = useState<AiProviderId | null>(null);

  const catalog = providersData?.catalog || [];
  const providers = providersData?.configured || [];

  const handleOpenDrawer = (providerId: AiProviderId) => {
    setSelectedProviderId(providerId);
    setIsDrawerOpen(true);
  };

  const handleAddProviderClick = () => {
    // Open drawer with first unconfigured provider, or Anthropic
    const unconfigured = catalog.find((c) => !providers.some((p) => p.provider === c.id));
    setSelectedProviderId(unconfigured ? unconfigured.id : AiProviderId.ANTHROPIC);
    setIsDrawerOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F6F2E9] pb-16">
      {/* Top Header */}
      <header className="border-b border-[#D9D4CA] bg-white/70 backdrop-blur-sm sticky top-0 z-30 px-6 lg:px-12 py-5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <nav className="text-[11px] uppercase tracking-widest text-[#8A877F] mb-1">
              <span>Administration</span>
              <span className="mx-2 text-[#D9D4CA]">/</span>
              <span className="text-[#936C3E] font-medium">Paramètres IA</span>
            </nav>
            <h1 className="font-heading text-3xl md:text-4xl text-[#061938] font-normal tracking-tight">
              Paramètres IA Pattern Studio
            </h1>
            <p className="text-xs text-[#5C697A] mt-1 max-w-2xl leading-relaxed">
              Connectez vos fournisseurs d&apos;IA de pointe pour l&apos;assistance à la création, la morphométrie et les détails de coupe.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleAddProviderClick}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#061938] hover:bg-[#0C2650] text-[#FFFFFF] rounded-sm text-xs font-semibold tracking-wider uppercase transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4 text-[#C5B190]" />
              <span>Ajouter un fournisseur</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Grid 8/12 + 4/12 */}
      <main className="max-w-7xl mx-auto px-6 lg:px-12 pt-8">
        <div className="grid grid-cols-12 gap-8 items-start">
          {/* Left Column (8 of 12) */}
          <div className="col-span-12 lg:col-span-8 space-y-8">
            {/* 1. Modèle actif par usage */}
            <ActiveModelSection
              routing={routingData}
              catalog={catalog}
              providers={providers}
              isLoading={isLoadingProviders || isLoadingRouting}
            />

            {/* 2. Fournisseurs connectés */}
            <section className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#D9D4CA]">
                <div className="flex items-center gap-2.5">
                  <h2 className="font-heading text-xl text-[#061938] font-normal leading-tight">
                    Fournisseurs connectés
                  </h2>
                  <span className="w-5 h-5 rounded-full bg-[#061938] text-[#F6F2E9] text-[10px] font-semibold flex items-center justify-center">
                    {providers.length}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-[#5C697A]">
                  <span className="w-2 h-2 rounded-full bg-[#46745A] animate-pulse" />
                  <span>Synchronisation en continu</span>
                  <button
                    type="button"
                    onClick={() => refetchProviders()}
                    className="p-1 hover:text-[#061938] transition-colors ml-1"
                    title="Actualiser la liste"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {isLoadingProviders ? (
                <div className="p-8 text-center bg-white border border-[#D9D4CA] rounded-sm text-xs text-[#5C697A]">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#936C3E] mb-2" />
                  Chargement des fournisseurs d&apos;IA...
                </div>
              ) : providers.length === 0 ? (
                <div className="p-8 text-center bg-white border border-[#D9D4CA] rounded-sm text-xs text-[#5C697A] space-y-2">
                  <Layers className="w-8 h-8 mx-auto text-[#8A877F] mb-1" />
                  <p className="font-medium text-[#061938]">Aucun fournisseur externe configuré.</p>
                  <p>Sélectionnez un fournisseur dans le catalogue ci-dessous pour le connecter à votre Atelier.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {providers.map((config) => (
                    <ConnectedProviderCard
                      key={config.provider}
                      config={config}
                      catalogEntry={catalog.find((c) => c.id === config.provider)}
                      routing={routingData}
                      onEdit={handleOpenDrawer}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* 3. Catalogue de fournisseurs */}
            <ProviderCatalogGrid
              catalog={catalog}
              providers={providers}
              onSelectProvider={handleOpenDrawer}
            />
          </div>

          {/* Right Column (4 of 12) - Sticky Lateral Panel */}
          <aside className="col-span-12 lg:col-span-4 sticky top-28 space-y-6">
            <ActiveModelSummary
              routing={routingData}
              catalog={catalog}
              providers={providers}
            />

            <EngineGuaranteeBanner />
          </aside>
        </div>
      </main>

      {/* Slide-over Drawer Modal */}
      <ConnectProviderDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        providerId={selectedProviderId}
        catalog={catalog}
        providers={providers}
      />
    </div>
  );
};
