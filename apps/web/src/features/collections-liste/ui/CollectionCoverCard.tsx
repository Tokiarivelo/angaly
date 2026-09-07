import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { CollectionDto } from '@angaly/types';

/** Real Stitch screen's "exhibition poster" card: full-bleed cover, navy gradient overlay, content anchored bottom. */
export function CollectionCoverCard({ collection }: { collection: CollectionDto }) {
  const media = collection.media[0];
  const description = collection.description ?? collection.story ?? '';
  const yearLabel = collection.seasonYear ? String(collection.seasonYear) : 'Archives';

  return (
    <Link
      href={`/collections/${collection.slug}`}
      className="group relative aspect-[3/4] overflow-hidden rounded-sm bg-angaly-navy"
    >
      {media ? (
        <Image
          src={media.url}
          alt={media.altText}
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-br from-angaly-royal-navy to-angaly-navy-blue transition-transform duration-700 group-hover:scale-105"
        />
      )}
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-angaly-navy via-angaly-navy/50 to-transparent opacity-80" />
      <div className="absolute inset-0 flex flex-col justify-end p-10">
        <span className="mb-3 text-xs tracking-widest text-angaly-champagne uppercase">{yearLabel}</span>
        <h3 className="font-heading mb-4 text-3xl tracking-wide text-angaly-ivory md:text-4xl">{collection.name}</h3>
        <p className="mb-6 max-w-md text-sm leading-relaxed font-light text-angaly-warm-ivory/80">{description}</p>
        <span className="group-hover:text-angaly-champagne flex items-center text-sm tracking-widest text-angaly-ivory uppercase transition-colors">
          Découvrir la collection
          <ArrowRight className="ml-2 h-[18px] w-[18px]" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
