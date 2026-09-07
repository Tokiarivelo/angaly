import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { CreationDto } from '@angaly/types';

/** Real Stitch screen's "Fait partie de la collection" — horizontal scroll row. Rendered only when there's a real collection. */
export function RelatedCollectionRow({
  collectionName,
  collectionHref,
  creations,
}: {
  collectionName: string;
  collectionHref: string;
  creations: CreationDto[];
}) {
  if (creations.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="mb-12 flex items-end justify-between">
        <h3 className="font-heading text-2xl tracking-wide text-angaly-navy uppercase">Fait partie de la collection</h3>
        <Link href={collectionHref} className="hover:text-angaly-navy flex items-center gap-1 text-sm text-angaly-slate transition-colors">
          Voir la collection
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
      <div className="flex gap-6 overflow-x-auto pb-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {creations.map((creation) => (
          <Link key={creation.id} href={`/creations/${creation.slug}`} className="group w-[70vw] shrink-0 md:w-1/3">
            <div className="mb-4 aspect-[3/4] overflow-hidden rounded-sm bg-angaly-warm-ivory">
              <div
                aria-hidden="true"
                className="h-full w-full bg-gradient-to-br from-angaly-royal-navy to-angaly-navy-blue transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <h4 className="font-heading mb-1 text-lg text-angaly-navy">{creation.name}</h4>
            <p className="text-xs text-angaly-slate">{collectionName}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
