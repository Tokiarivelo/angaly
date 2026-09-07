import Image from 'next/image';
import Link from 'next/link';
import type { AtelierDto } from '@angaly/types';

import { ROUTES } from '@/lib/routes';

/** Real Stitch screen's "Featured Atelier Banner": 60vh full-bleed photo, shown unconditionally (not optional). */
export function FeaturedAtelierBanner({ atelier }: { atelier: AtelierDto }) {
  const photo = [...atelier.media].sort((a, b) => a.sortOrder - b.sortOrder)[0];

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-8">
      <div className="group relative flex h-[60vh] min-h-[400px] items-end overflow-hidden bg-angaly-warm-ivory p-8 sm:p-12">
        {photo ? (
          <Image
            src={photo.url}
            alt={photo.altText}
            fill
            sizes="100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-br from-angaly-royal-navy to-angaly-navy-blue"
          />
        )}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-angaly-navy/80 via-angaly-navy/20 to-transparent"
        />
        <div className="relative z-10 w-full max-w-2xl space-y-6 text-white">
          <h2 className="font-heading text-3xl tracking-wide sm:text-4xl">Notre atelier principal — {atelier.city}</h2>
          <p className="max-w-md text-sm font-light text-angaly-ivory/90 sm:text-base">
            Le cœur battant de la Maison ANGALY, où nos maîtres artisans donnent vie à nos créations les plus
            exclusives dans un cadre baigné de lumière naturelle.
          </p>
          <Link
            href={ROUTES.prendreRendezVous}
            className="inline-flex items-center justify-center bg-white px-8 py-3 text-sm font-medium text-angaly-navy transition-colors hover:bg-angaly-ivory"
          >
            Prendre rendez-vous ici
          </Link>
        </div>
      </div>
    </section>
  );
}
