'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Eye, EyeOff, ExternalLink, Monitor, Smartphone } from 'lucide-react';

import type { SectionDefinition } from '../consts/section-catalog.const';
import type { SectionImage } from './SectionImageField';

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
}

function paragraphs(text: string | null | undefined): string[] {
  return (text ?? '').split(/\n\n+/).filter((paragraph) => paragraph.trim().length > 0);
}

function summarizeItem(item: Record<string, unknown>): string | null {
  const parts = [item['year'], item['title'], item['name'], item['question'], item['label']].filter((part): part is string => typeof part === 'string' && part !== '');
  return parts.length > 0 ? parts.join(' — ') : null;
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

/** Live preview of the section as edited (unsaved values included), at desktop or mobile width. */
export const PreviewToggle: React.FC<PreviewToggleProps> = ({ isOpen, onToggle, content, image, definition, publicHref }) => {
  const [mobile, setMobile] = useState(false);
  const data = content.dataJson ?? {};
  const eyebrow = stringValue(data['eyebrow']);
  const quote = stringValue(data['quote']);
  const precisionTile = stringValue(data['precisionTileLabel']);
  const listFields = (definition?.data ?? []).filter((field) => field.kind === 'list');
  const isEmpty = !content.titleText && !content.subtitleText && !content.bodyText && !image && !eyebrow;

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onToggle} className="flex items-center gap-2 text-sm text-angaly-slate hover:text-angaly-navy">
          {isOpen ? <EyeOff size={16} /> : <Eye size={16} />}
          Aperçu
        </button>
        {publicHref && (
          <a href={publicHref} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-angaly-slate underline hover:text-angaly-navy">
            Voir la page publiée <ExternalLink size={12} />
          </a>
        )}
      </div>

      {isOpen && (
        <div className="mt-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-angaly-slate">Mode d'aperçu</span>
            <div className="flex gap-1 rounded-sm border border-angaly-border bg-white p-0.5" role="group" aria-label="Largeur de l’aperçu">
              <button
                type="button"
                aria-pressed={!mobile}
                onClick={() => setMobile(false)}
                className={`rounded-sm p-1.5 transition-colors ${!mobile ? 'bg-angaly-navy text-white' : 'text-angaly-slate hover:text-angaly-navy'}`}
              >
                <Monitor size={14} aria-label="Ordinateur" />
              </button>
              <button
                type="button"
                aria-pressed={mobile}
                onClick={() => setMobile(true)}
                className={`rounded-sm p-1.5 transition-colors ${mobile ? 'bg-angaly-navy text-white' : 'text-angaly-slate hover:text-angaly-navy'}`}
              >
                <Smartphone size={14} aria-label="Mobile" />
              </button>
            </div>
          </div>

          <div
            data-testid="section-preview"
            className={`mx-auto overflow-hidden rounded-sm border border-angaly-border bg-angaly-ivory shadow-xs transition-all ${
              mobile ? 'max-w-[360px]' : 'w-full'
            }`}
          >
            {image && (
              <div className="relative h-44 w-full">
                <Image src={image.url} alt={image.altText ?? ''} fill sizes="(min-width: 768px) 600px, 360px" className="object-cover" />
              </div>
            )}
            <div className="space-y-3 p-6 text-center">
              {isEmpty && <p className="text-sm text-angaly-slate">Rien à afficher pour l’instant.</p>}
              {eyebrow && <p className="text-[11px] uppercase tracking-widest text-angaly-gold">{eyebrow}</p>}
              {content.titleText && <p className="font-heading text-2xl text-angaly-navy">{content.titleText}</p>}
              {content.subtitleText && <p className="text-sm text-angaly-slate">{content.subtitleText}</p>}
              {paragraphs(content.bodyText).map((paragraph, index) => (
                <p key={index} className="text-sm leading-relaxed text-angaly-navy/80">
                  {paragraph}
                </p>
              ))}
              {quote && <blockquote className="border-l-2 border-angaly-gold pl-3 text-left font-serif text-sm italic text-angaly-navy">{quote}</blockquote>}
              {precisionTile && <p className="text-xs uppercase tracking-widest text-angaly-slate">{precisionTile}</p>}
              {listFields.map((field) => {
                const items = Array.isArray(data[field.key]) ? (data[field.key] as Record<string, unknown>[]) : [];
                if (items.length === 0) return null;
                return (
                  <ul key={field.key} className="space-y-1 text-left text-xs text-angaly-slate">
                    {items.map((item, index) => (
                      <li key={index}>
                        {summarizeItem(item) ?? `${field.itemLabel} ${index + 1}`}
                      </li>
                    ))}
                  </ul>
                );
              })}
              {(Boolean(content.ctaPrimaryLabel) || Boolean(content.ctaSecondaryLabel)) && (
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  {content.ctaPrimaryLabel && <span className="rounded-sm bg-angaly-navy px-5 py-2 text-xs font-medium tracking-wider uppercase text-white shadow-xs">{content.ctaPrimaryLabel}</span>}
                  {content.ctaSecondaryLabel && <span className="rounded-sm border border-angaly-navy px-5 py-2 text-xs font-medium tracking-wider uppercase text-angaly-navy">{content.ctaSecondaryLabel}</span>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
