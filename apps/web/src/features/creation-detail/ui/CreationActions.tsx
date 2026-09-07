'use client';

import { Heart, Share2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import type { CreationDto } from '@angaly/types';

import { ROUTES } from '@/lib/routes';

/**
 * Real Stitch screen's actions column. "Créer une version personnalisée"
 * links to the real future route even though `personnalisation-creation`
 * (Phase 2) isn't built yet — never a dead/missing link in prod, same
 * convention as docs/pages/home.md. Favorite is local-only UI state (no
 * persistence, depends on `customers`/Phase 2) and share uses the Web
 * Share API with a clipboard fallback.
 */
export function CreationActions({ creation }: { creation: CreationDto }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: creation.name, url });
      } catch {
        // User cancelled the share sheet — not an error.
      }
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setShareFeedback('Lien copié !');
      setTimeout(() => setShareFeedback(null), 2000);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Link
        href={ROUTES.prendreRendezVous}
        className="flex w-full items-center justify-center rounded-sm bg-angaly-navy py-4 text-sm tracking-wider text-white uppercase transition-colors hover:bg-angaly-navy-blue"
      >
        Prendre rendez-vous
      </Link>
      <Link
        href={`/creations/${creation.slug}/personnaliser`}
        className="flex w-full items-center justify-center rounded-sm border border-angaly-navy py-4 text-sm tracking-wider text-angaly-navy uppercase transition-colors hover:bg-angaly-navy hover:text-white"
      >
        Créer une version personnalisée
      </Link>

      <div className="border-angaly-border/50 mt-4 flex items-center justify-between border-t pt-4">
        <button
          type="button"
          aria-pressed={isFavorite}
          onClick={() => setIsFavorite((current) => !current)}
          className="hover:text-angaly-navy flex items-center gap-2 text-sm text-angaly-slate transition-colors"
        >
          <Heart className="h-5 w-5" aria-hidden="true" fill={isFavorite ? 'currentColor' : 'none'} />
          <span>Sauvegarder</span>
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => void handleShare()}
            className="hover:text-angaly-navy flex items-center gap-2 text-sm text-angaly-slate transition-colors"
          >
            <Share2 className="h-5 w-5" aria-hidden="true" />
            <span>Partager</span>
          </button>
          {shareFeedback && (
            <span role="status" className="absolute top-full right-0 mt-1 text-xs text-angaly-slate whitespace-nowrap">
              {shareFeedback}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
