import Image from 'next/image';
import Link from 'next/link';
import type { CollectionDetailDto } from '@angaly/types';

import { ROUTES } from '@/lib/routes';

/** Real Stitch screen's 80vh cinematic cover: breadcrumb, season badge, title, italic tagline. */
export function CollectionCover({ collection }: { collection: CollectionDetailDto }) {
  const media = collection.media[0];
  const tagline = collection.description ?? collection.story ?? '';

  return (
    <section className="relative flex h-[80vh] w-full items-center justify-center text-center">
      <div className="absolute inset-0 z-0">
        {media ? (
          <Image src={media.url} alt={media.altText} fill priority sizes="100vw" className="object-cover" />
        ) : (
          <div
            aria-hidden="true"
            className="h-full w-full bg-gradient-to-br from-angaly-royal-navy to-angaly-navy-blue"
          />
        )}
        <div aria-hidden="true" className="from-angaly-navy/80 via-angaly-navy/40 absolute inset-0 bg-gradient-to-t to-transparent" />
      </div>
      <div className="relative z-10 flex max-w-4xl flex-col items-center px-8 text-angaly-ivory">
        <nav aria-label="Fil d'Ariane" className="mb-8 text-xs tracking-widest uppercase opacity-80">
          <Link href={ROUTES.home} className="hover:text-angaly-champagne transition-colors">
            Accueil
          </Link>{' '}
          /{' '}
          <Link href={ROUTES.collections} className="hover:text-angaly-champagne transition-colors">
            Collections
          </Link>{' '}
          / <span className="text-angaly-champagne">{collection.name}</span>
        </nav>
        {collection.seasonYear && (
          <span className="mb-6 border border-angaly-ivory/30 px-4 py-1 text-xs tracking-widest uppercase backdrop-blur-sm">
            Collection {collection.seasonYear}
          </span>
        )}
        <h1 className="font-heading mb-6 text-5xl tracking-wide md:text-7xl lg:text-8xl">{collection.name}</h1>
        {tagline && (
          <p className="font-heading mx-auto max-w-2xl text-xl font-light text-angaly-ivory/90 italic md:text-2xl">
            {tagline}
          </p>
        )}
      </div>
    </section>
  );
}
