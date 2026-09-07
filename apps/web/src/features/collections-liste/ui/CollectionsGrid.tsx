import type { CollectionDto } from '@angaly/types';

import { CollectionCoverCard } from './CollectionCoverCard';

/** Real Stitch screen: a strict 2-column grid, not 3/4 columns at wider breakpoints. */
export function CollectionsGrid({ collections }: { collections: CollectionDto[] }) {
  if (collections.length === 0) {
    return (
      <p className="mx-auto max-w-[1920px] px-8 py-12 text-center text-sm text-angaly-slate">
        Aucune collection publiée pour le moment.
      </p>
    );
  }

  return (
    <section className="mx-auto max-w-[1920px] px-4 pb-24 md:px-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {collections.map((collection) => (
          <CollectionCoverCard key={collection.id} collection={collection} />
        ))}
      </div>
    </section>
  );
}
