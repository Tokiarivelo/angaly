'use client';

import Image from 'next/image';
import type { CreationDto } from '@angaly/types';

import { useGalleryLightbox } from '../hooks/useGalleryLightbox';

/**
 * Real Stitch screen: reversed-row on desktop (thumbnails right of the main
 * image, `md:flex-row-reverse`), vertical thumbnail stack on desktop /
 * horizontal scroll on mobile. No real photography yet — a gradient stands
 * in for each `<img>` until Media has real URLs (Phase 6/content).
 */
export function CreationGallery({ creation }: { creation: CreationDto }) {
  const { activeIndex, setActiveIndex } = useGalleryLightbox(creation.media.length);
  const activeMedia = creation.media[activeIndex];

  return (
    <div className="flex w-full flex-col gap-4 md:w-[60%] md:flex-row-reverse">
      <div className="relative aspect-[3/4] flex-1 overflow-hidden rounded-sm bg-angaly-warm-ivory">
        {activeMedia ? (
          <Image
            src={activeMedia.url}
            alt={activeMedia.altText || creation.name}
            fill
            priority
            sizes="(min-width: 768px) 60vw, 100vw"
            className="object-cover"
          />
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
    </div>
  );
}
