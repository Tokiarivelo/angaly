import Link from 'next/link';
import type { CreationDto } from '@angaly/types';

import type { HomeContent } from '../hooks/useHomeContent';

/** stitch-prompts/01-home.md "SECTION 2 — LA UNE". Wired to real featured GET /api/creations. */
export function LaUneSection({
  content,
  creations,
}: {
  content: HomeContent['laUne'];
  creations: CreationDto[];
}) {
  if (creations.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <p className="text-xs tracking-[0.3em] text-angaly-champagne uppercase">{content.eyebrow}</p>
      <div className="border-angaly-champagne mt-2 h-px w-16 border-t" aria-hidden="true" />
      <h2 className="font-heading mt-6 max-w-2xl text-4xl text-angaly-navy sm:text-5xl">{content.headline}</h2>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {creations.map((creation, index) => (
          <article
            key={creation.id}
            className={`group relative overflow-hidden bg-angaly-warm-ivory ${index === 0 ? 'sm:col-span-2 sm:aspect-[16/9] lg:col-span-1 lg:aspect-[3/4]' : 'aspect-[3/4]'}`}
          >
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-br from-angaly-royal-navy to-angaly-navy-blue transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-x-0 bottom-0 bg-angaly-navy/80 p-4 text-white">
              <p className="font-heading text-lg">{creation.name}</p>
              <p className="mt-1 text-xs text-white/70">{creation.category.name}</p>
              <Link
                href={`/creations/${creation.slug}`}
                className="mt-2 inline-block text-xs text-angaly-champagne hover:underline"
              >
                Découvrir →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
