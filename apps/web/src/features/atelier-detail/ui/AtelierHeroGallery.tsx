import { Ruler, Scissors } from 'lucide-react';
import Image from 'next/image';
import type { AtelierDto } from '@angaly/types';

import type { AtelierDetailContent } from '../hooks/useAtelierDetailContent';

/**
 * Real screen's hero: 8/4-col split, large photo left, two stacked tiles right — the bottom
 * tile ("L'art de la précision") is a fixed decorative icon tile in the real design, not a
 * photo slot. The top-right tile falls back to a decorative tile too when there's no second
 * distinct photo (never duplicates the large photo right beside itself). Tagline + tile
 * label are real content — see hooks/useAtelierDetailContent.ts.
 */
export function AtelierHeroGallery({
  atelier,
  content,
}: {
  atelier: AtelierDto;
  content: AtelierDetailContent['hero'];
}) {
  const photos = [...atelier.media].sort((a, b) => a.sortOrder - b.sortOrder);
  const large = photos[0];
  const secondary = photos.length > 1 ? photos[1] : undefined;

  return (
    <section className="px-8 pb-16">
      <div className="mb-12 text-center">
        <h1 className="font-heading mb-4 text-5xl tracking-wide text-angaly-navy md:text-6xl">{atelier.name}</h1>
        <p className="text-sm tracking-widest text-angaly-slate uppercase">{content.tagline}</p>
      </div>
      <div className="grid h-[60vh] min-h-[500px] grid-cols-1 gap-4 md:grid-cols-12">
        <div className="group relative h-full overflow-hidden md:col-span-8">
          {large ? (
            <Image
              src={large.url}
              alt={large.altText}
              fill
              sizes="(min-width: 768px) 66vw, 100vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-angaly-warm-ivory p-8 text-center">
              <Scissors className="mb-4 h-9 w-9 text-angaly-champagne" strokeWidth={1} aria-hidden="true" />
              <p className="font-heading text-2xl text-angaly-navy italic">Notre savoir-faire</p>
            </div>
          )}
        </div>
        <div className="flex h-full flex-col gap-4 md:col-span-4">
          <div className="group relative h-1/2 overflow-hidden">
            {secondary ? (
              <Image
                src={secondary.url}
                alt={secondary.altText}
                fill
                sizes="(min-width: 768px) 33vw, 100vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-angaly-warm-ivory p-6 text-center">
                <Scissors className="mb-3 h-7 w-7 text-angaly-champagne" strokeWidth={1} aria-hidden="true" />
              </div>
            )}
          </div>
          <div className="flex h-1/2 flex-col items-center justify-center bg-angaly-warm-ivory p-8 text-center">
            <Ruler className="mb-4 h-9 w-9 text-angaly-champagne" strokeWidth={1} aria-hidden="true" />
            <p className="font-heading text-2xl text-angaly-navy italic">{content.precisionTileLabel}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
