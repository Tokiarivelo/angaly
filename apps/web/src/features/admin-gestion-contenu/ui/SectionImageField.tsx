'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ImageIcon } from 'lucide-react';

import type { MediaItemDto } from '../../admin-mediatheque/types/media-item.types';
import { MediaPickerDialog } from './MediaPickerDialog';

export interface SectionImage {
  url: string;
  altText: string | null;
}

interface SectionImageFieldProps {
  label: string;
  image: SectionImage | null;
  onPick: (media: MediaItemDto) => void;
  onClear: () => void;
  /** When set the image can't be changed here (e.g. a translation inheriting the base locale's image) — shown as the note. */
  lockedNote?: string | undefined;
}

/** The section's image slot (`mediaId`): current image preview + choose/replace/remove. */
export const SectionImageField: React.FC<SectionImageFieldProps> = ({ label, image, onPick, onClear, lockedNote }) => {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold text-angaly-slate uppercase tracking-wider">{label}</p>
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <div className="relative h-32 w-48 shrink-0 overflow-hidden rounded-sm border border-angaly-border bg-angaly-ivory shadow-inner">
          {image ? (
            <Image src={image.url} alt={image.altText ?? label} fill sizes="192px" className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-angaly-warm-gray">
              <ImageIcon size={28} aria-hidden="true" />
            </div>
          )}
        </div>
        {lockedNote ? (
          <p className="text-xs text-angaly-slate mt-2">{lockedNote}</p>
        ) : (
        <div className="flex flex-col items-start gap-2.5 mt-1">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="rounded-sm border border-angaly-navy px-4 py-2 text-xs font-semibold uppercase tracking-wider text-angaly-navy hover:bg-angaly-ivory transition-colors"
          >
            {image ? 'Remplacer l’image' : 'Choisir une image'}
          </button>
          {image && (
            <button type="button" onClick={onClear} className="text-xs text-angaly-error hover:underline font-medium">
              Retirer l’image
            </button>
          )}
          {!image && <p className="text-xs text-angaly-slate">Aucune image : l’image par défaut du site est utilisée.</p>}
        </div>
        )}
      </div>
      {pickerOpen && (
        <MediaPickerDialog
          isOpen
          onClose={() => setPickerOpen(false)}
          onSelect={(media) => {
            onPick(media);
            setPickerOpen(false);
          }}
        />
      )}
    </div>
  );
};
