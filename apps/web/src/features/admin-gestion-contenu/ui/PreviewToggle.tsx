'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, ExternalLink, Monitor, Smartphone, LayoutTemplate, Layers } from 'lucide-react';

import type { SectionDefinition } from '../consts/section-catalog.const';
import type { SectionImage } from './SectionImageField';
import { CmsComponentRenderer } from './components/CmsComponentRenderer';
import { LiveLandingPagePreview } from './components/LiveLandingPagePreview';

export interface SectionPreviewContent {
  titleText?: string | null | undefined;
  subtitleText?: string | null | undefined;
  bodyText?: string | null | undefined;
  ctaPrimaryLabel?: string | null | undefined;
  ctaSecondaryLabel?: string | null | undefined;
  dataJson?: Record<string, unknown> | null | undefined;
}

interface PreviewToggleProps {
  isOpen: boolean;
  onToggle: () => void;
  content: SectionPreviewContent;
  image: SectionImage | null;
  /** Catalogue entry — lets the preview render the structured lists (chronology, gallery…) too. */
  definition?: SectionDefinition | undefined;
  /** Public URL of the page this section belongs to, when it has a stable one. */
  publicHref?: string | undefined;
  page?: string | undefined;
  sectionKey?: string | undefined;
}

/** Live Haute Couture preview of the section as edited, at desktop or mobile width, in isolated or landing-page mode. */
export const PreviewToggle: React.FC<PreviewToggleProps> = ({
  isOpen,
  onToggle,
  content,
  image,
  definition,
  publicHref,
  page,
  sectionKey,
}) => {
  const [mobile, setMobile] = useState(false);
  const [viewMode, setViewMode] = useState<'component' | 'landing-page'>('component');

  const isLandingPage = page === 'accueil';

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-2 text-sm text-angaly-slate hover:text-angaly-navy font-medium transition-colors"
        >
          {isOpen ? <EyeOff size={16} /> : <Eye size={16} />}
          Aperçu Haute Couture
        </button>
        {publicHref && (
          <a
            href={publicHref}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-angaly-slate hover:text-angaly-gold transition-colors font-medium underline"
          >
            Voir la page publiée <ExternalLink size={12} />
          </a>
        )}
      </div>

      {isOpen && (
        <div className="mt-4 space-y-3">
          {/* Preview Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-angaly-ivory/60 p-2.5 rounded-sm border border-angaly-border">
            {/* View Mode (Component vs Landing Page) */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-angaly-slate">
                Mode d&apos;aperçu :
              </span>
              <div className="flex gap-1 rounded-sm border border-angaly-border bg-white p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('component')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-sm transition-colors font-medium ${
                    viewMode === 'component'
                      ? 'bg-angaly-navy text-white shadow-xs'
                      : 'text-angaly-slate hover:text-angaly-navy'
                  }`}
                >
                  <Layers size={13} />
                  <span>Composant réel</span>
                </button>
                {isLandingPage && (
                  <button
                    type="button"
                    onClick={() => setViewMode('landing-page')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-sm transition-colors font-medium ${
                      viewMode === 'landing-page'
                        ? 'bg-angaly-navy text-white shadow-xs'
                        : 'text-angaly-slate hover:text-angaly-navy'
                    }`}
                  >
                    <LayoutTemplate size={13} />
                    <span>Contexte Accueil</span>
                  </button>
                )}
              </div>
            </div>

            {/* Device Switcher (Desktop vs Mobile) */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-angaly-slate">
                Format :
              </span>
              <div className="flex gap-1 rounded-sm border border-angaly-border bg-white p-0.5" role="group" aria-label="Largeur de l’aperçu">
                <button
                  type="button"
                  aria-pressed={!mobile}
                  onClick={() => setMobile(false)}
                  className={`rounded-sm p-1.5 transition-colors ${
                    !mobile ? 'bg-angaly-navy text-white' : 'text-angaly-slate hover:text-angaly-navy'
                  }`}
                >
                  <Monitor size={14} aria-label="Ordinateur" />
                </button>
                <button
                  type="button"
                  aria-pressed={mobile}
                  onClick={() => setMobile(true)}
                  className={`rounded-sm p-1.5 transition-colors ${
                    mobile ? 'bg-angaly-navy text-white' : 'text-angaly-slate hover:text-angaly-navy'
                  }`}
                >
                  <Smartphone size={14} aria-label="Mobile" />
                </button>
              </div>
            </div>
          </div>

          {/* Live Preview Display Box */}
          <div
            data-testid="section-preview"
            className={`mx-auto overflow-hidden transition-all duration-300 ${
              mobile
                ? 'max-w-[390px] border-[6px] border-angaly-navy/80 rounded-2xl shadow-2xl p-1 bg-angaly-navy/95'
                : 'w-full rounded-sm border border-angaly-border shadow-sm bg-white'
            }`}
          >
            {mobile && (
              <div className="h-4 w-28 bg-angaly-navy mx-auto rounded-b-md mb-1 border-b border-angaly-royal-navy flex items-center justify-center">
                <div className="h-1 w-8 bg-angaly-royal-navy rounded-full" />
              </div>
            )}

            <div className="overflow-hidden rounded-xs">
              {viewMode === 'landing-page' && isLandingPage ? (
                <LiveLandingPagePreview
                  currentSectionKey={sectionKey}
                  content={content}
                  image={image}
                  isMobile={mobile}
                />
              ) : (
                <CmsComponentRenderer
                  page={page}
                  sectionKey={sectionKey}
                  content={content}
                  image={image}
                  definition={definition}
                  isCompact={mobile}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
