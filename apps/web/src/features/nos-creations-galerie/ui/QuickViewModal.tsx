'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Heart, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import type { CreationDto } from '@angaly/types';

interface QuickViewModalProps {
  creation: CreationDto | null;
  onClose: () => void;
}

/**
 * stitch-prompts/03-nos-creations-galerie.md "QUICK VIEW MODAL": image on one
 * side, title/category/collection/description + "Voir la création" (primary)
 * / "Ajouter aux favoris" (secondary) on the other. No real screen capture
 * shows this state (the Stitch HTML has no modal markup at all — confirmed by
 * downloading and grepping the real HTML, not a screenshot), so the layout
 * follows the text prompt. Built on the same Radix Dialog pattern as
 * components/navigation/MobileDrawer.tsx. Favorite here is its own local
 * toggle, independent of CreationCard's — both are non-persistent local UI
 * state (Phase 2/customers), not worth synchronizing for a demo-only state.
 */
export function QuickViewModal({ creation, onClose }: QuickViewModalProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  if (!creation) {
    return null;
  }

  const media = creation.media[0];
  const badge = creation.collection ? `${creation.collection.name} — ${creation.category.name}` : creation.category.name;

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-angaly-navy/60" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed top-1/2 left-1/2 z-[70] flex max-h-[90vh] w-[92vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-y-auto rounded-sm bg-angaly-ivory md:flex-row md:overflow-hidden"
        >
          <Dialog.Title className="sr-only">Aperçu rapide — {creation.name}</Dialog.Title>
          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Fermer l'aperçu rapide"
              className="absolute top-4 right-4 z-10 rounded-full bg-white/80 p-1.5 text-angaly-navy backdrop-blur transition-colors hover:bg-white"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </Dialog.Close>

          <div className="relative aspect-[3/4] w-full shrink-0 bg-angaly-warm-ivory md:w-1/2">
            {media ? (
              <Image
                src={media.url}
                alt={media.altText || creation.name}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            ) : (
              <div
                aria-hidden="true"
                className="h-full w-full bg-gradient-to-br from-angaly-royal-navy to-angaly-navy-blue"
              />
            )}
          </div>

          <div className="flex w-full flex-col gap-4 p-8 md:w-1/2">
            <span className="w-fit rounded-sm bg-angaly-warm-ivory px-3 py-1 text-xs tracking-widest text-angaly-navy uppercase">
              {badge}
            </span>
            <h2 className="font-heading text-3xl text-angaly-navy">{creation.name}</h2>
            <p className="line-clamp-6 text-sm leading-relaxed text-angaly-slate">{creation.description}</p>

            <div className="mt-4 flex flex-col gap-3">
              <Link
                href={`/creations/${creation.slug}`}
                onClick={onClose}
                className="flex w-full items-center justify-center rounded-sm bg-angaly-navy py-3 text-sm tracking-wider text-white uppercase transition-colors hover:bg-angaly-navy-blue"
              >
                Voir la création
              </Link>
              <button
                type="button"
                aria-pressed={isFavorite}
                onClick={() => setIsFavorite((current) => !current)}
                className="flex w-full items-center justify-center gap-2 rounded-sm border border-angaly-navy py-3 text-sm tracking-wider text-angaly-navy uppercase transition-colors hover:bg-angaly-navy hover:text-white"
              >
                <Heart className="h-4 w-4" aria-hidden="true" fill={isFavorite ? 'currentColor' : 'none'} />
                Ajouter aux favoris
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
