import Image from 'next/image';
import Link from 'next/link';
import type { CollectionDto } from '@angaly/types';

/** Real Stitch screen's "Collection du moment" banner: bordered card, image left, content right. */
export function FeaturedCollectionBanner({ collection }: { collection: CollectionDto }) {
  const media = collection.media[0];
  const description = collection.description ?? collection.story ?? '';

  return (
    <section className="mx-auto mb-24 max-w-[1920px] px-4 md:px-8">
      <div className="border-angaly-border flex flex-col overflow-hidden rounded-sm border bg-angaly-ivory md:flex-row">
        <div className="relative min-h-[500px] md:w-1/2">
          {media ? (
            <Image src={media.url} alt={media.altText} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
          ) : (
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-br from-angaly-royal-navy to-angaly-navy-blue"
            />
          )}
        </div>
        <div className="flex flex-col justify-center p-12 md:w-1/2 md:p-24">
          <span className="mb-4 block text-xs tracking-widest text-angaly-champagne uppercase">Collection du moment</span>
          <h2 className="font-heading mb-6 text-4xl tracking-wide text-angaly-navy md:text-5xl">{collection.name}</h2>
          <p className="mb-8 leading-relaxed font-light text-angaly-slate">{description}</p>
          <div className="mb-10 flex items-center gap-4">
            <span className="font-heading text-2xl text-angaly-navy">{collection.creationsCount}</span>
            <span className="text-sm tracking-wider text-angaly-slate uppercase">
              {collection.creationsCount === 1 ? 'Création' : 'Créations'}
            </span>
          </div>
          <Link
            href={`/collections/${collection.slug}`}
            className="hover:bg-angaly-navy-blue inline-flex items-center justify-center bg-angaly-navy px-8 py-4 text-sm tracking-widest text-white uppercase transition-colors"
          >
            Découvrir la collection
          </Link>
        </div>
      </div>
    </section>
  );
}
