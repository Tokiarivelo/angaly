import Image from 'next/image';
import type { CollectionDetailDto } from '@angaly/types';

import { splitStory } from '../utils/splitStory';

/**
 * Real Stitch screen's 2-col story section: photo (with a decorative offset
 * frame) + narrative. The optional "in the atelier" video thumbnail is
 * omitted — `Collection` has no `videoUrl` field, same tradeoff already
 * documented in docs/pages/collections-liste.md.
 */
export function CollectionStory({ collection }: { collection: CollectionDetailDto }) {
  const media = collection.media[1] ?? collection.media[0];
  const paragraphs = splitStory(collection.story, collection.description);

  return (
    <section className="mx-auto max-w-[1400px] px-8 py-24 md:px-16 lg:px-24">
      <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-24">
        <div className="relative">
          <div className="relative aspect-[3/4] w-full shadow-sm">
            {media ? (
              <Image src={media.url} alt={media.altText} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
            ) : (
              <div
                aria-hidden="true"
                className="h-full w-full bg-gradient-to-br from-angaly-champagne to-angaly-gold-light"
              />
            )}
          </div>
          <div aria-hidden="true" className="border-angaly-border absolute -right-8 -bottom-8 -z-10 h-2/3 w-2/3 border" />
        </div>
        <div className="flex flex-col">
          <h2 className="font-heading mb-8 text-4xl tracking-wide text-angaly-navy md:text-5xl">
            L&apos;histoire de la collection
          </h2>
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="mb-6 text-sm leading-relaxed text-angaly-slate last:mb-0">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
