'use client';

import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Sparkles,
  X,
  Monitor,
  Smartphone,
  Check,
  Plus,
  Layers,
  Palette,
} from 'lucide-react';

import type { CatalogPageEntry } from '../utils/merge-section-catalog';
import type { AddSectionPayload } from '../types/template.types';
import { useTemplateAtelier } from '../hooks/useTemplateAtelier';
import { CmsComponentRenderer } from './components/CmsComponentRenderer';

interface TemplateAtelierModalProps {
  isOpen: boolean;
  onClose: () => void;
  pages: CatalogPageEntry[];
  initialPage?: string | undefined;
  onAddSection: (payload: AddSectionPayload) => void;
  isAdding?: boolean;
}

const CATEGORIES = [
  { id: 'all', label: 'Tous les gabarits' },
  { id: 'hero', label: 'Bandeaux & Hero' },
  { id: 'editorial', label: 'Éditorial & Savoir-faire' },
  { id: 'vitrine', label: 'Vitrine & Univers' },
  { id: 'process', label: 'Parcours & Étapes' },
  { id: 'engagement', label: 'Appels & Cercle Privé' },
] as const;

export const TemplateAtelierModal: React.FC<TemplateAtelierModalProps> = ({
  isOpen,
  onClose,
  pages,
  initialPage,
  onAddSection,
  isAdding = false,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [previewMobile, setPreviewMobile] = useState<boolean>(false);

  const atelier = useTemplateAtelier({
    pages,
    initialPage,
    onAddSection: (payload) => {
      onAddSection(payload);
      onClose();
    },
    isAdding,
  });

  const filteredPresets =
    activeCategory === 'all'
      ? atelier.presets
      : atelier.presets.filter((preset) => preset.category === activeCategory);

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-angaly-navy-dark/70 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in" />
        <Dialog.Content
          data-testid="template-atelier-modal"
          className="fixed left-1/2 top-1/2 z-50 flex h-[92vh] w-[95vw] max-w-7xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-sm border border-angaly-border bg-white shadow-2xl overflow-hidden focus:outline-none animate-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-angaly-border bg-angaly-ivory/80 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-angaly-navy text-angaly-champagne shadow-xs">
                <Sparkles size={18} />
              </div>
              <div>
                <Dialog.Title className="font-heading text-xl sm:text-2xl text-angaly-navy font-normal tracking-wide">
                  Atelier de Gabarits & Composants Réutilisables
                </Dialog.Title>
                <Dialog.Description className="text-xs text-angaly-slate font-medium">
                  Composez, personnalisez et ajoutez des sections d’exception à la page de votre choix.
                </Dialog.Description>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm p-2 text-angaly-slate hover:bg-angaly-warm-ivory/50 hover:text-angaly-navy transition-colors"
              aria-label="Fermer l'Atelier"
            >
              <X size={20} />
            </button>
          </div>

          {/* Main 2-Column Work Area */}
          <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
            {/* Left Column: Preset Catalog + Customizer */}
            <div className="flex flex-col w-full lg:w-[460px] xl:w-[500px] border-b lg:border-b-0 lg:border-r border-angaly-border bg-white overflow-y-auto">
              {/* Category Pills */}
              <div className="p-4 border-b border-angaly-border bg-angaly-ivory/30">
                <p className="text-[10px] uppercase tracking-widest font-bold text-angaly-navy mb-2">
                  1. Choisir un gabarit
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-2.5 py-1 text-[11px] rounded-sm transition-colors font-medium ${
                        activeCategory === cat.id
                          ? 'bg-angaly-navy text-white shadow-xs'
                          : 'bg-white text-angaly-slate border border-angaly-border hover:bg-angaly-ivory'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Presets List */}
              <div className="p-4 border-b border-angaly-border space-y-2 max-h-56 overflow-y-auto bg-angaly-ivory/10">
                {filteredPresets.map((preset) => {
                  const isSelected = atelier.selectedPreset.id === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => atelier.selectPreset(preset)}
                      className={`w-full flex items-start gap-3 p-3 rounded-sm text-left transition-all border ${
                        isSelected
                          ? 'border-angaly-gold bg-angaly-ivory shadow-xs ring-1 ring-angaly-gold'
                          : 'border-angaly-border bg-white hover:bg-angaly-ivory/50'
                      }`}
                    >
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-sm ${
                          isSelected ? 'bg-angaly-navy text-angaly-gold' : 'bg-angaly-ivory text-angaly-slate'
                        }`}
                      >
                        <Layers size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-heading text-sm text-angaly-navy font-semibold truncate">
                            {preset.name}
                          </p>
                          {isSelected && <Check size={14} className="text-angaly-gold shrink-0" />}
                        </div>
                        <p className="text-[11px] text-angaly-slate line-clamp-1 mt-0.5 font-sans">
                          {preset.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Page & Section Configuration Form */}
              <div className="p-5 space-y-5 flex-1">
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-angaly-navy mb-3">
                    2. Destination & Identification
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-angaly-slate mb-1">
                        Page de destination
                      </label>
                      <select
                        value={atelier.targetPage}
                        onChange={(e) => atelier.setTargetPage(e.target.value)}
                        className="w-full p-2 border border-angaly-border rounded-sm text-xs bg-white text-angaly-navy focus:outline-none focus:border-angaly-gold"
                      >
                        {atelier.availablePages.map((page) => (
                          <option key={page.page} value={page.page}>
                            {page.label} (/{page.page === 'accueil' ? '' : page.page})
                          </option>
                        ))}
                        <option value="__custom__">+ Créer une nouvelle page...</option>
                      </select>
                    </div>

                    {atelier.targetPage === '__custom__' && (
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-angaly-slate mb-1">
                          Nom de la nouvelle page (slug)
                        </label>
                        <input
                          type="text"
                          value={atelier.customPage}
                          onChange={(e) => atelier.setCustomPage(e.target.value)}
                          placeholder="ex. defiles-prives"
                          className="w-full p-2 border border-angaly-border rounded-sm text-xs bg-white text-angaly-navy focus:outline-none focus:border-angaly-gold"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-angaly-slate mb-1">
                          Libellé de la section
                        </label>
                        <input
                          type="text"
                          value={atelier.label}
                          onChange={(e) => atelier.handleLabelChange(e.target.value)}
                          className="w-full p-2 border border-angaly-border rounded-sm text-xs bg-white text-angaly-navy focus:outline-none focus:border-angaly-gold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-angaly-slate mb-1">
                          Clé technique (slug)
                        </label>
                        <input
                          type="text"
                          value={atelier.sectionKey}
                          onChange={(e) => atelier.handleSectionKeyChange(e.target.value)}
                          className="w-full p-2 border border-angaly-border rounded-sm text-xs bg-white text-angaly-navy font-mono focus:outline-none focus:border-angaly-gold"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customizer Values */}
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-angaly-navy mb-3">
                    3. Personnalisation du contenu
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-angaly-slate mb-1">
                        Titre
                      </label>
                      <input
                        type="text"
                        value={atelier.customValues.titleText}
                        onChange={(e) =>
                          atelier.setCustomValues((prev) => ({ ...prev, titleText: e.target.value }))
                        }
                        className="w-full p-2 border border-angaly-border rounded-sm text-xs font-heading text-lg text-angaly-navy bg-white focus:outline-none focus:border-angaly-gold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-angaly-slate mb-1">
                        Sur-titre (Eyebrow) / Sous-titre
                      </label>
                      <input
                        type="text"
                        value={atelier.customValues.subtitleText}
                        onChange={(e) =>
                          atelier.setCustomValues((prev) => ({ ...prev, subtitleText: e.target.value }))
                        }
                        className="w-full p-2 border border-angaly-border rounded-sm text-xs bg-white text-angaly-navy focus:outline-none focus:border-angaly-gold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-angaly-slate mb-1">
                        Paragraphe / Description
                      </label>
                      <textarea
                        rows={3}
                        value={atelier.customValues.bodyText}
                        onChange={(e) =>
                          atelier.setCustomValues((prev) => ({ ...prev, bodyText: e.target.value }))
                        }
                        className="w-full p-2 border border-angaly-border rounded-sm text-xs bg-white text-angaly-navy focus:outline-none focus:border-angaly-gold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-angaly-slate mb-1">
                          Bouton principal
                        </label>
                        <input
                          type="text"
                          value={atelier.customValues.ctaPrimaryLabel}
                          onChange={(e) =>
                            atelier.setCustomValues((prev) => ({ ...prev, ctaPrimaryLabel: e.target.value }))
                          }
                          className="w-full p-2 border border-angaly-border rounded-sm text-xs bg-white text-angaly-navy focus:outline-none focus:border-angaly-gold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-angaly-slate mb-1">
                          Bouton secondaire
                        </label>
                        <input
                          type="text"
                          value={atelier.customValues.ctaSecondaryLabel}
                          onChange={(e) =>
                            atelier.setCustomValues((prev) => ({ ...prev, ctaSecondaryLabel: e.target.value }))
                          }
                          className="w-full p-2 border border-angaly-border rounded-sm text-xs bg-white text-angaly-navy focus:outline-none focus:border-angaly-gold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-angaly-slate mb-1">
                        URL de l&apos;image (ou médiathèque)
                      </label>
                      <input
                        type="text"
                        value={atelier.customValues.imageUrl}
                        onChange={(e) =>
                          atelier.setCustomValues((prev) => ({ ...prev, imageUrl: e.target.value }))
                        }
                        placeholder="https://..."
                        className="w-full p-2 border border-angaly-border rounded-sm text-xs bg-white text-angaly-navy focus:outline-none focus:border-angaly-gold font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Live High-Fidelity Preview */}
            <div className="flex-1 flex flex-col bg-angaly-ivory/40 overflow-y-auto">
              <div className="p-3 border-b border-angaly-border bg-white flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-2">
                  <Palette size={14} className="text-angaly-gold" />
                  <span className="text-xs font-semibold text-angaly-navy uppercase tracking-wider">
                    Aperçu Haute Couture en temps réel
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-angaly-slate font-medium">Format :</span>
                  <div className="flex gap-1 rounded-sm border border-angaly-border bg-white p-0.5">
                    <button
                      type="button"
                      onClick={() => setPreviewMobile(false)}
                      className={`p-1.5 rounded-sm transition-colors ${
                        !previewMobile ? 'bg-angaly-navy text-white' : 'text-angaly-slate hover:text-angaly-navy'
                      }`}
                      aria-label="Aperçu Ordinateur"
                    >
                      <Monitor size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewMobile(true)}
                      className={`p-1.5 rounded-sm transition-colors ${
                        previewMobile ? 'bg-angaly-navy text-white' : 'text-angaly-slate hover:text-angaly-navy'
                      }`}
                      aria-label="Aperçu Mobile"
                    >
                      <Smartphone size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-10 flex-1 flex items-center justify-center">
                <div
                  className={`w-full transition-all duration-300 ${
                    previewMobile
                      ? 'max-w-[390px] border-[6px] border-angaly-navy/80 rounded-2xl shadow-2xl p-1 bg-angaly-navy/95'
                      : 'max-w-4xl shadow-md rounded-sm overflow-hidden'
                  }`}
                >
                  {previewMobile && (
                    <div className="h-3 w-24 bg-angaly-navy mx-auto rounded-b-md mb-1 border-b border-angaly-royal-navy flex items-center justify-center">
                      <div className="h-1 w-6 bg-angaly-royal-navy rounded-full" />
                    </div>
                  )}
                  <CmsComponentRenderer
                    page={atelier.effectivePage}
                    sectionKey={atelier.sectionKey}
                    content={{
                      titleText: atelier.customValues.titleText,
                      subtitleText: atelier.customValues.subtitleText,
                      bodyText: atelier.customValues.bodyText,
                      ctaPrimaryLabel: atelier.customValues.ctaPrimaryLabel,
                      ctaSecondaryLabel: atelier.customValues.ctaSecondaryLabel,
                      dataJson: {
                        ...atelier.customValues.dataJson,
                        templateKind: atelier.selectedPreset.kind,
                      },
                    }}
                    image={
                      atelier.customValues.imageUrl
                        ? { url: atelier.customValues.imageUrl, altText: atelier.customValues.imageAlt }
                        : null
                    }
                    isCompact={previewMobile}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Bar with Action Buttons */}
          <div className="flex items-center justify-between border-t border-angaly-border bg-white px-6 py-4 shadow-xs">
            <div className="flex items-center gap-2 text-xs text-angaly-slate">
              <span className="font-semibold text-angaly-navy uppercase tracking-wider">Destination :</span>
              <span className="font-mono bg-angaly-ivory px-2 py-0.5 rounded-sm border border-angaly-border text-angaly-navy">
                {atelier.effectivePage}/{atelier.sectionKey}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 text-xs font-semibold uppercase tracking-wider border border-angaly-border text-angaly-slate hover:bg-angaly-ivory transition-colors rounded-sm"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={atelier.isAdding || !atelier.sectionKey || !atelier.effectivePage}
                onClick={atelier.handleAdd}
                className="px-6 py-2 text-xs font-semibold uppercase tracking-wider bg-angaly-navy text-white hover:bg-angaly-navy-blue transition-colors rounded-sm shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                <Plus size={16} />
                <span>
                  {atelier.isAdding ? 'Création en cours…' : 'Ajouter la section à la page'}
                </span>
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
