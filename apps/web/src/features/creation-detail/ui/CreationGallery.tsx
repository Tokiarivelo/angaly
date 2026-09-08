'use client';

import { ZoomIn } from 'lucide-react';
import Image from 'next/image';
import type { CreationDto } from '@angaly/types';

import { useGalleryLightbox } from '../hooks/useGalleryLightbox';
import { GalleryLightbox } from './GalleryLightbox';

/**
 * Real Stitch screen: reversed-row on desktop (thumbnails right of the main
 * image, `md:flex-row-reverse`), vertical thumbnail stack on desktop /
 * horizontal scroll on mobile. No real photography yet — a gradient stands
 * in for each `<img>` until Media has real URLs (Phase 6/content). The main
 * image opens a full-screen lightbox on click ("Support a lightbox/zoom
 * state on click", stitch-prompts/04-creation-detail.md) — the real screen's
 * `zoom_in` icon chip is reproduced but always visible on touch (no hover),
 * revealed on hover/focus only at `md:` and up.
 */
export function CreationGallery({ creation }: { creation: CreationDto }) {
  const { activeIndex, setActiveIndex, isOpen, open, close, next, previous } = useGalleryLightbox(
    creation.media.length,
  );
  const activeMedia = creation.media[activeIndex];

  return (
    <div className="flex w-full flex-col gap-4 md:w-[60%] md:flex-row-reverse">
      <div className="relative aspect-[3/4] flex-1 overflow-hidden rounded-sm bg-angaly-warm-ivory">
        {activeMedia ? (
          <button type="button" aria-label="Agrandir l'image" onClick={open} className="group absolute inset-0 h-full w-full">
            <Image
              src={activeMedia.url}
              alt={activeMedia.altText || creation.name}
              fill
              priority
              sizes="(min-width: 768px) 60vw, 100vw"
              className="object-cover"
            />
            <span
              aria-hidden="true"
              className="absolute right-4 bottom-4 rounded-full bg-white/80 p-2 text-angaly-navy backdrop-blur transition-colors group-hover:bg-white md:opacity-0 md:group-hover:opacity-100 md:group-focus-visible:opacity-100"
            >
              <ZoomIn className="h-5 w-5" aria-hidden="true" />
            </span>
          </button>
        ) : (
          <div
            aria-hidden="true"
            className="h-full w-full bg-gradient-to-br from-angaly-royal-navy to-angaly-navy-blue"
          />
        )}
      </div>

      {creation.media.length > 1 && (
        <div className="flex shrink-0 gap-4 overflow-x-auto md:w-24 md:flex-col md:overflow-visible">
          {creation.media.map((media, index) => (
            <button
              key={media.id}
              type="button"
              aria-label={`Voir l'image ${index + 1}`}
              aria-current={index === activeIndex}
              onClick={() => setActiveIndex(index)}
              className={`relative aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-sm border transition-all md:w-full ${
                index === activeIndex ? 'border-angaly-navy' : 'border-angaly-border opacity-70 hover:opacity-100'
              }`}
            >
              <Image src={media.url} alt={media.altText || creation.name} fill sizes="96px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      <GalleryLightbox
        media={creation.media}
        activeIndex={activeIndex}
        isOpen={isOpen}
        onClose={close}
        onNext={next}
        onPrevious={previous}
        altFallback={creation.name}
      />
    </div>
  );
}
