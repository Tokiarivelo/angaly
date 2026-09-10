'use client';

import { Calendar, Heart } from 'lucide-react';
import Link from 'next/link';
import { ProductAvailability, type ProductVariantDto } from '@angaly/types';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/routes';

interface ProductActionsGroupProps {
  productId: string;
  productStatus: ProductAvailability;
  selectedVariant: ProductVariantDto | null;
  isFavorite: boolean;
  justAddedToCart: boolean;
  onAddToCart: () => void;
  onToggleFavorite: () => void;
}

/**
 * 4 actions verified against the real Stitch screen (no "Contacter Angaly"
 * action there, unlike this fiche's own earlier text — real screen wins,
 * see "Points d'attention"). "Ajouter au panier" is disabled when the
 * selected variant is OUT_OF_STOCK/RESERVED — "Réserver pour essayage"
 * stays the visible alternative in that case (docs/pages/fiche-produit.md).
 */
export function ProductActionsGroup({
  productId,
  productStatus,
  selectedVariant,
  isFavorite,
  justAddedToCart,
  onAddToCart,
  onToggleFavorite,
}: ProductActionsGroupProps) {
  const isUnavailable =
    productStatus === ProductAvailability.OUT_OF_STOCK || productStatus === ProductAvailability.RESERVED;
  const canAddToCart = Boolean(selectedVariant) && !isUnavailable;

  const reservationHref = selectedVariant
    ? `${ROUTES.reservationEssayage}?productId=${productId}&size=${encodeURIComponent(selectedVariant.size)}`
    : ROUTES.reservationEssayage;

  return (
    <div className="flex flex-col gap-4">
      <div className="mt-2 flex flex-col gap-4">
        <Button type="button" disabled={!canAddToCart} onClick={onAddToCart} className="w-full uppercase tracking-widest">
          {justAddedToCart ? 'Ajouté au panier ✓' : 'Ajouter au panier'}
        </Button>
        <Button asChild variant="secondary" className="w-full uppercase tracking-widest">
          <Link href={reservationHref}>Réserver pour essayage</Link>
        </Button>
      </div>

      <div className="mt-4 flex justify-center gap-8 border-t border-angaly-border pt-4">
        <Link href={ROUTES.prendreRendezVous} className="group flex items-center gap-2 text-sm text-angaly-slate hover:text-angaly-navy">
          <Calendar size={20} className="transition-transform group-hover:scale-110" aria-hidden="true" />
          Prendre rendez-vous
        </Link>
        <button
          type="button"
          onClick={onToggleFavorite}
          aria-pressed={isFavorite}
          className="group flex items-center gap-2 text-sm text-angaly-slate hover:text-angaly-navy"
        >
          <Heart
            size={20}
            className="transition-transform group-hover:scale-110"
            aria-hidden="true"
            fill={isFavorite ? 'currentColor' : 'none'}
          />
          {isFavorite ? 'Dans vos favoris' : 'Ajouter aux favoris'}
        </button>
      </div>
    </div>
  );
}
