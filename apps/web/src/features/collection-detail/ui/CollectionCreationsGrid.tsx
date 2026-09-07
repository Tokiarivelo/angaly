import Image from 'next/image';
import Link from 'next/link';
import type { CollectionCreationDto } from '@angaly/types';

/**
 * Real Stitch screen's "Lookbook" gallery: 3-col grid with an alternating
 * vertical offset rhythm (item 2 mt-16, item 3 mt-8, repeating).
 *
 * `GET /api/collections/:slug` returns `CollectionCreationDto[]` (id, slug,
 * name, coverImageUrl only) — a lighter shape than `CreationDto`, so this
 * can't reuse nos-creations-galerie's `CreationCard` (category pill,
 * materials, favorite button) despite the plan in docs/pages/collection-
 * detail.md written before that real shape was known. No category eyebrow
 * here since the DTO doesn't carry one.
 */
const OFFSET_RHYTHM = ['lg:mt-0', 'lg:mt-16', 'lg:mt-8'];

export function CollectionCreationsGrid({ creations }: { creations: CollectionCreationDto[] }) {
  return (
    <section className="mx-auto max-w-[1400px] bg-angaly-warm-ivory/30 px-8 py-24 md:px-16 lg:px-24">
      <div className="mb-16 text-center">
        <span className="mb-4 block text-xs tracking-[0.3em] text-angaly-champagne uppercase">Lookbook</span>
        <h2 className="font-heading text-4xl tracking-wide text-angaly-navy md:text-5xl">
          Les créations de la collection
        </h2>
      </div>

      {creations.length === 0 ? (
        <p className="text-center text-sm text-angaly-slate">Aucune création publiée dans cette collection pour le moment.</p>
      ) : (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12 lg:grid-cols-3">
          {creations.map((creation, index) => (
            <Link key={creation.id} href={`/creations/${creation.slug}`} className={`group flex flex-col ${OFFSET_RHYTHM[index % OFFSET_RHYTHM.length]}`}>
              <div className="relative mb-6 aspect-[3/4] overflow-hidden bg-angaly-warm-ivory">
                {creation.coverImageUrl ? (
                  <Image
                    src={creation.coverImageUrl}
                    alt={creation.name}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover transition-transform duration-1000 group-hover:scale-105"
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className="h-full w-full bg-gradient-to-br from-angaly-royal-navy to-angaly-navy-blue transition-transform duration-1000 group-hover:scale-105"
                  />
                )}
              </div>
              <div className="flex flex-col items-center text-center">
                <h3 className="font-heading mb-3 text-2xl text-angaly-navy">{creation.name}</h3>
                <span className="group-hover:text-angaly-champagne group-hover:border-angaly-champagne border-b border-angaly-navy pb-1 text-xs tracking-widest text-angaly-navy uppercase transition-colors">
                  Voir la création
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
