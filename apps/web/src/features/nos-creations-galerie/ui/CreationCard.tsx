'use client';

import { Heart } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import type { CreationDto } from '@angaly/types';

/**
 * Real Stitch screen's masonry card: image (hover-zoom), favorite overlay
 * top-right, category pill bottom-left, then centered title + materials
 * subtitle below. Mixed aspect ratios (mostly portrait, one wide "landscape"
 * slot) recreate the real screen's masonry rhythm — see ASPECT_RATIOS.
 *
 * The favorite button is local-only UI state (no persistence): real
 * favorites depend on `customers`/Phase 2 auth, not built yet. Exposed at
 * the logged-out state rather than hidden, per docs/pages/nos-creations-
 * galerie.md "Points d'attention".
 */
const ASPECT_RATIOS = [0.67, 0.75, 0.75, 1.79, 0.75, 0.67];

export function CreationCard({ creation, index }: { creation: CreationDto; index: number }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const aspectRatio = ASPECT_RATIOS[index % ASPECT_RATIOS.length];

  return (
    <article className="group relative mb-12 break-inside-avoid">
      <Link
        href={`/creations/${creation.slug}`}
        className="relative block w-full overflow-hidden rounded-sm bg-angaly-warm-ivory"
        style={{ aspectRatio }}
      >
        <div
          aria-hidden="true"
          className="h-full w-full bg-gradient-to-br from-angaly-royal-navy to-angaly-navy-blue transition-transform duration-700 group-hover:scale-105"
        />
        <span className="absolute bottom-4 left-4 rounded-sm bg-angaly-ivory/90 px-3 py-1 text-[10px] tracking-widest text-angaly-navy uppercase backdrop-blur-md">
          {creation.category.name}
        </span>
      </Link>
      <button
        type="button"
        aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        aria-pressed={isFavorite}
        onClick={() => setIsFavorite((current) => !current)}
        className="hover:text-angaly-champagne absolute top-4 right-4 rounded-full bg-angaly-navy/20 p-2 text-white opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100"
      >
        <Heart className="h-5 w-5" aria-hidden="true" fill={isFavorite ? 'currentColor' : 'none'} />
      </button>

      <div className="mt-4 flex flex-col items-center text-center">
        <Link
          href={`/creations/${creation.slug}`}
          className="group-hover:text-angaly-soft-navy font-heading text-xl text-angaly-navy transition-colors"
        >
          {creation.name}
        </Link>
        {creation.materials && <p className="mt-1 text-xs text-angaly-warm-gray">{creation.materials}</p>}
      </div>
    </article>
  );
}
