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
    <section className="mx-auto max-w-7xl px-6 py-24 md:px-16">
      <div className="border-angaly-border mb-16 flex items-center justify-between border-b pb-8">
        <h2 className="font-heading text-4xl tracking-wide text-angaly-navy md:text-5xl">{content.headline}</h2>
        <Link
          href={ROUTES.laUne}
          className="text-angaly-soft-navy hover:text-angaly-navy hidden items-center text-xs tracking-widest uppercase transition-colors md:flex"
        >
          {content.cta}
          <ArrowRight className="ml-2 h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-8 md:h-[800px] md:grid-cols-12">
        <article className="group relative h-[600px] overflow-hidden bg-angaly-warm-ivory md:col-span-7 md:h-full">
          <div
            aria-hidden="true"
            className="h-full w-full bg-gradient-to-br from-angaly-royal-navy to-angaly-navy-blue transition-transform duration-700 group-hover:scale-105"
          />
          <div
            aria-hidden="true"
            className="from-angaly-navy/80 absolute inset-0 bg-gradient-to-t via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
          <div className="absolute bottom-0 left-0 w-full translate-y-4 p-8 text-white transition-transform duration-500 group-hover:translate-y-0">
            <p className="text-xs tracking-widest uppercase opacity-80">Nouveau</p>
            <h3 className="font-heading mt-2 text-4xl">{hero.name}</h3>
            <Link
              href={`/creations/${hero.slug}`}
              className="hover:text-angaly-champagne hover:border-angaly-champagne mt-4 inline-flex items-center border-b border-white pb-1 text-sm tracking-widest uppercase transition-colors"
            >
              Découvrir
            </Link>
          </div>
        </article>

        {rest.length > 0 && (
          <div className="flex h-[600px] flex-col gap-8 md:col-span-5 md:h-full">
            {rest.map((creation) => (
              <article key={creation.id} className="group relative flex-1 overflow-hidden bg-angaly-warm-ivory">
                <div
                  aria-hidden="true"
                  className="h-full w-full bg-gradient-to-br from-angaly-royal-navy to-angaly-navy-blue transition-transform duration-700 group-hover:scale-105"
                />
                <div className="bg-angaly-navy/40 absolute bottom-0 left-0 w-full p-6 text-white backdrop-blur-sm">
                  <Link href={`/creations/${creation.slug}`} className="font-heading text-2xl">
                    {creation.name}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
