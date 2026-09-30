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
      <p className="mb-1 text-xs font-medium text-angaly-slate">{label}</p>
      <div className="flex items-start gap-4">
        <div className="relative h-28 w-40 shrink-0 overflow-hidden rounded-lg border border-border bg-angaly-ivory">
          {image ? (
            <Image src={image.url} alt={image.altText ?? label} fill sizes="160px" className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-angaly-warm-gray">
              <ImageIcon size={28} aria-hidden="true" />
            </div>
          )}
        </div>
        {lockedNote ? (
          <p className="text-xs text-angaly-slate">{lockedNote}</p>
        ) : (
        <div className="flex flex-col items-start gap-2">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-angaly-navy hover:bg-angaly-ivory"
          >
            {image ? 'Remplacer l’image' : 'Choisir une image'}
          </button>
          {image && (
            <button type="button" onClick={onClear} className="text-xs text-angaly-slate underline hover:text-angaly-error">
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
