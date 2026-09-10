'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import Image from 'next/image';
import type { ProductMediaDto } from '@angaly/types';

interface GalleryLightboxProps {
  media: ProductMediaDto[];
  activeIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  altFallback: string;
}

/** Same Radix Dialog pattern as creation-detail/ui/GalleryLightbox.tsx — duplicated, not imported (feature-slice isolation). */
export function GalleryLightbox({ media, activeIndex, isOpen, onClose, onNext, onPrevious, altFallback }: GalleryLightboxProps) {
  const activeMedia = media[activeIndex];

  if (!activeMedia) {
    return null;
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-angaly-navy/95" />
        <Dialog.Content
          aria-describedby={undefined}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight') {
              onNext();
            } else if (event.key === 'ArrowLeft') {
              onPrevious();
            }
          }}
          className="fixed inset-0 z-[70] flex flex-col items-center justify-center p-4 outline-none md:p-12"
        >
          <Dialog.Title className="sr-only">Aperçu agrandi — {altFallback}</Dialog.Title>
          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Fermer l'aperçu"
              className="absolute top-4 right-4 text-angaly-ivory transition-colors hover:text-angaly-champagne md:top-8 md:right-8"
            >
              <X className="h-7 w-7" aria-hidden="true" />
            </button>
          </Dialog.Close>

          <div className="relative h-full w-full max-w-5xl">
            <Image src={activeMedia.url} alt={activeMedia.altText || altFallback} fill sizes="100vw" className="object-contain" priority />
          </div>

          {media.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Image précédente"
                onClick={onPrevious}
                className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-angaly-ivory transition-colors hover:bg-white/20 md:left-8"
              >
                <ChevronLeft className="h-6 w-6" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Image suivante"
                onClick={onNext}
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-angaly-ivory transition-colors hover:bg-white/20 md:right-8"
              >
                <ChevronRight className="h-6 w-6" aria-hidden="true" />
              </button>
              <p className="absolute bottom-4 text-xs tracking-widest text-angaly-ivory/70 uppercase">
                {activeIndex + 1} / {media.length}
              </p>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
