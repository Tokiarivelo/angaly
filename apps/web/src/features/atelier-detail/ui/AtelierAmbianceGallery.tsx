import { Sparkles } from 'lucide-react';
import Image from 'next/image';
import type { AtelierDto } from '@angaly/types';

const QUOTE = 'Chaque détail est pensé, chaque couture est une signature.';

/**
 * Real screen's "L'atelier en images": 4 real-photo tiles (1 large + 3 normal) around one
 * fixed decorative quote tile. With fewer photos than slots, tiles cycle through the
 * available ones (same graceful-reuse pattern as `AtelierGallerySection`/`CreationCard`
 * elsewhere this session) rather than leaving empty gaps.
 */
export function AtelierAmbianceGallery({ atelier }: { atelier: AtelierDto }) {
  const photos = [...atelier.media].sort((a, b) => a.sortOrder - b.sortOrder);

  const photoAt = (index: number) => (photos.length > 0 ? photos[index % photos.length] : undefined);

  const tiles = [
    { kind: 'photo' as const, photo: photoAt(0), size: 'large' as const },
    { kind: 'photo' as const, photo: photoAt(1), size: 'normal' as const },
    { kind: 'quote' as const },
    { kind: 'photo' as const, photo: photoAt(2), size: 'normal' as const },
    { kind: 'photo' as const, photo: photoAt(3), size: 'normal' as const },
  ];

  return (
    <section className="bg-white px-8 py-16">
      <div className="mb-12 text-center">
        <h2 className="font-heading mb-2 text-4xl text-angaly-navy italic">L&apos;atelier en images</h2>
        <p className="text-sm text-angaly-slate">Le savoir-faire à l&apos;état pur</p>
      </div>
      <div className="grid auto-rows-[250px] grid-cols-2 gap-4 md:grid-cols-4">
        {tiles.map((tile, index) => {
          if (tile.kind === 'quote') {
            return (
              <div
                key="quote"
                className="flex items-center justify-center bg-angaly-warm-ivory p-6 text-center"
              >
                <p className="font-heading text-lg leading-relaxed text-angaly-navy">{QUOTE}</p>
              </div>
            );
          }

          const isLarge = tile.size === 'large';
          return (
            <div
              key={index}
              className={`group relative overflow-hidden ${isLarge ? 'col-span-2 row-span-2' : 'col-span-2 md:col-span-1'}`}
            >
              {tile.photo ? (
                <Image
                  src={tile.photo.url}
                  alt={tile.photo.altText}
                  fill
                  sizes={isLarge ? '(min-width: 768px) 50vw, 100vw' : '(min-width: 768px) 25vw, 50vw'}
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-angaly-warm-ivory">
                  <Sparkles className="h-8 w-8 text-angaly-champagne" strokeWidth={1} aria-hidden="true" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
