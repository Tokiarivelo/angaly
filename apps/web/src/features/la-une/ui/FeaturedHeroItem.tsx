import Image from 'next/image';
import Link from 'next/link';

import { contentTypeLabel } from '../consts/content-type-filters.const';
import type { LaUneItem } from '../types/la-une-item.types';

/**
 * Real Stitch "La Une" screen: full-bleed hero (70vh/85vh), dark overlay,
 * centered content. Falls back to a navy gradient when the item has no
 * real photo yet.
 */
export function FeaturedHeroItem({ item }: { item: LaUneItem }) {
  const label = contentTypeLabel(item.contentType);

  return (
    <section className="w-full px-4 py-12 md:px-8">
      <article className="group relative flex h-[70vh] w-full items-center justify-center overflow-hidden bg-angaly-warm-ivory md:h-[85vh]">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            priority
            sizes="100vw"
            className="object-cover transition-transform duration-1000 group-hover:scale-105"
          />
        ) : (
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-br from-angaly-royal-navy via-angaly-navy-blue to-angaly-navy transition-transform duration-1000 group-hover:scale-105"
          />
        )}
        <div aria-hidden="true" className="bg-angaly-navy/40 absolute inset-0 transition-opacity duration-500" />
        <div className="relative z-10 flex max-w-2xl flex-col items-center px-6 text-center text-white">
          {label && (
            <span className="mb-6 rounded-sm border border-white/30 bg-white/10 px-3 py-1 text-xs tracking-widest uppercase backdrop-blur-sm">
              {label}
            </span>
          )}
          <h2 className="font-heading mb-6 text-4xl tracking-wide drop-shadow-md md:text-6xl">{item.title}</h2>
          <p className="mb-10 max-w-lg text-sm leading-relaxed text-angaly-ivory drop-shadow-sm md:text-base">
            {item.description}
          </p>
          <Link
            href={item.href}
            className="hover:bg-angaly-champagne inline-flex items-center justify-center bg-white px-8 py-4 text-sm tracking-widest text-angaly-navy uppercase transition-colors duration-300 hover:text-white"
          >
            Voir la création
          </Link>
        </div>
      </article>
    </section>
  );
}
