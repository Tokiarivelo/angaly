import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { CreationDto } from '@angaly/types';

import { ROUTES } from '@/lib/routes';

import type { HomeContent } from '../hooks/useHomeContent';

/**
 * stitch-prompts/01-home.md "SECTION 2 — LA UNE" / real mockup: heading +
 * "voir toutes les collections" link, then an asymmetrical editorial grid
 * (one large tile, two stacked). Wired to real featured GET /api/creations.
 */
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

  const preview = creations.slice(0, 3);
  // Safe: the length check above guarantees at least one item.
  const hero = preview[0]!;
  const rest = preview.slice(1);

  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h2 className="font-heading text-4xl text-angaly-navy sm:text-5xl">{content.headline}</h2>
        <Link
          href={ROUTES.laUne}
          className="inline-flex items-center gap-2 text-xs tracking-wide text-angaly-navy uppercase hover:text-angaly-champagne"
        >
          {content.cta}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
      <div className="bg-angaly-slate/20 mt-6 h-px w-full" aria-hidden="true" />

      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        <CreationTile creation={hero} className="sm:col-span-2 sm:aspect-[16/10]" />

        {rest.length > 0 && (
          <div className="flex flex-col gap-6">
            {rest.map((creation) => (
              <CreationTile key={creation.id} creation={creation} className="aspect-[16/9]" />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function CreationTile({ creation, className = '' }: { creation: CreationDto; className?: string }) {
  return (
    <article className={`group relative overflow-hidden bg-angaly-warm-ivory ${className}`}>
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-br from-angaly-royal-navy to-angaly-navy-blue transition-transform duration-500 group-hover:scale-105"
      />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/70" />
      <div className="absolute inset-x-0 bottom-0 p-6 text-white">
        <p className="font-heading text-xl">{creation.name}</p>
        <Link
          href={`/creations/${creation.slug}`}
          className="mt-2 inline-block text-xs tracking-wide uppercase hover:underline"
        >
          Découvrir →
        </Link>
      </div>
    </article>
  );
}
