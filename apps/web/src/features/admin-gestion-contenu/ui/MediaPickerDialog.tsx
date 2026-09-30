'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import type { MediaItemDto } from '../../admin-mediatheque/types/media-item.types';
import { useMediaPicker } from '../hooks/useMediaPicker';

interface MediaPickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: MediaItemDto) => void;
}

/** Pick an existing image from the media library. Uploading stays in /mediatheque (linked below). */
export const MediaPickerDialog: React.FC<MediaPickerDialogProps> = ({ isOpen, onClose, onSelect }) => {
  const [search, setSearch] = useState('');
  const { data, isLoading, isError } = useMediaPicker(isOpen, search);
  const images = (data?.data ?? []).filter((media) => media.mimeType.startsWith('image/'));

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[60] bg-angaly-navy/60" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-[60] flex max-h-[85vh] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl bg-white p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <DialogPrimitive.Title className="font-serif text-lg text-angaly-navy">Choisir une image</DialogPrimitive.Title>
            <DialogPrimitive.Close aria-label="Fermer" className="text-angaly-slate hover:text-angaly-navy">
              <X size={18} />
            </DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Description className="sr-only">Sélectionnez une image de la médiathèque.</DialogPrimitive.Description>

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher par nom ou texte alternatif…"
            aria-label="Rechercher une image"
            className="mb-4 w-full rounded-lg border border-border p-2.5 text-sm focus:border-angaly-navy focus:outline-none"
          />

          <div className="min-h-0 flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {Array.from({ length: 8 }, (_, i) => (
                  <Skeleton key={i} className="aspect-square w-full" />
                ))}
              </div>
            ) : isError ? (
              <p role="alert" className="text-sm text-angaly-error">Impossible de charger la médiathèque.</p>
            ) : images.length === 0 ? (
              <p className="text-sm text-angaly-slate">Aucune image trouvée.</p>
            ) : (
              <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {images.map((media) => (
                  <li key={media.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(media)}
                      className="group relative block aspect-square w-full overflow-hidden rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-angaly-navy"
                    >
                      <Image src={media.url} alt={media.altText ?? ''} fill sizes="160px" className="object-cover transition-transform group-hover:scale-105" />
                      <span className="sr-only">{media.altText ?? media.id}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <p className="mt-4 text-xs text-angaly-slate">
            Une nouvelle image ? Ajoutez-la d&apos;abord dans la{' '}
            <a href="/mediatheque" target="_blank" rel="noreferrer" className="underline hover:text-angaly-navy">
              médiathèque
            </a>
            .
          </p>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
