'use client';

import { Eye, Heart } from 'lucide-react';
import Image from 'next/image';
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
 *
 * The "Aperçu rapide" trigger (stitch-prompts/03-nos-creations-galerie.md)
 * isn't in the real static HTML capture (only the favorite overlay is —
 * confirmed by downloading and grepping the real HTML) — positioned centered
 * on hover as a standalone sibling of the `Link`, not nested inside it,
 * matching the favorite button's own sibling-overlay pattern (avoids an
 * invalid `<a><button>` nesting).
 */
const ASPECT_RATIOS = [0.67, 0.75, 0.75, 1.79, 0.75, 0.67];

export function CreationCard({
  creation,
  index,
  onQuickView,
}: {
  creation: CreationDto;
  index: number;
  onQuickView: (creation: CreationDto) => void;
}) {
  const [isFavorite, setIsFavorite] = useState(false);
  const aspectRatio = ASPECT_RATIOS[index % ASPECT_RATIOS.length];
  const media = creation.media[0];

  return (
    <article className="group relative mb-12 break-inside-avoid">
      <Link
        href={`/creations/${creation.slug}`}
        className="relative block w-full overflow-hidden rounded-sm bg-angaly-warm-ivory"
        style={{ aspectRatio }}
      >
        {media ? (
          <Image
            src={media.url}
            alt={media.altText || creation.name}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div
            aria-hidden="true"
            className="h-full w-full bg-gradient-to-br from-angaly-royal-navy to-angaly-navy-blue transition-transform duration-700 group-hover:scale-105"
          />
        )}
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

      <button
        type="button"
        aria-label="Aperçu rapide"
        onClick={() => onQuickView(creation)}
        className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full bg-angaly-ivory/95 px-4 py-2 text-xs tracking-widest text-angaly-navy uppercase opacity-0 backdrop-blur-md transition-opacity duration-300 group-hover:opacity-100 hover:bg-white"
      >
        <Eye className="h-4 w-4" aria-hidden="true" />
        Aperçu rapide
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
