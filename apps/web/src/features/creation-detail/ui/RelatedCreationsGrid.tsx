import Link from 'next/link';
import type { CreationDto } from '@angaly/types';

/** Real Stitch screen's "Vous aimerez aussi" — 4-col grid, image + centered title only. */
export function RelatedCreationsGrid({ creations }: { creations: CreationDto[] }) {
  if (creations.length === 0) {
    return null;
  }

  return (
    <section className="border-angaly-border/50 border-t bg-white px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <h3 className="font-heading mb-16 text-center text-3xl text-angaly-navy italic">Vous aimerez aussi</h3>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {creations.map((creation) => (
            <Link key={creation.id} href={`/creations/${creation.slug}`} className="group">
              <div className="mb-4 aspect-[3/4] overflow-hidden rounded-sm bg-angaly-ivory">
                <div
                  aria-hidden="true"
                  className="h-full w-full bg-gradient-to-br from-angaly-royal-navy to-angaly-navy-blue transition-opacity group-hover:opacity-90"
                />
              </div>
              <h4 className="font-heading text-center text-lg text-angaly-navy">{creation.name}</h4>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
