'use client';

import Image from 'next/image';
import type { ProductDto, ProductVariantDto } from '@angaly/types';

import { useGalleryLightbox } from '../hooks/useGalleryLightbox';
import { GalleryLightbox } from './GalleryLightbox';

interface ProductGalleryProps {
  product: ProductDto;
  /** The color/size currently picked in the purchase panel, if any. */
  selectedVariant?: ProductVariantDto | null;
}

/**
 * Verified against the real Stitch screen: thumbnails column LEFT of the
 * main image on desktop (`md:flex-row`), thumbnails row BELOW the main
 * image on mobile (`flex-col-reverse` — thumbnails are first in the DOM but
 * rendered after the now-first main image).
 *
 * Colorway swap: when the selected variant has its own photos, they replace
 * the product's shared media entirely — a variant with none (most products,
 * today) falls back to `product.media` exactly as before.
 */
export function ProductGallery({ product, selectedVariant }: ProductGalleryProps) {
  const media = selectedVariant?.media && selectedVariant.media.length > 0 ? selectedVariant.media : product.media;
  const { activeIndex, setActiveIndex, isOpen, open, close, next, previous } = useGalleryLightbox(media.length);
  const activeMedia = media[activeIndex];

  return (
    <div className="flex flex-col-reverse gap-6 md:flex-row">
      {media.length > 1 && (
        <div className="flex w-full shrink-0 gap-4 overflow-x-auto md:w-24 md:flex-col md:overflow-visible">
          {media.map((mediaItem, index) => (
            <button
              key={mediaItem.id}
              type="button"
              aria-label={`Voir l'image ${index + 1}`}
              aria-current={index === activeIndex}
              onClick={() => setActiveIndex(index)}
              className={`h-28 w-20 shrink-0 border md:h-32 md:w-24 ${
                index === activeIndex ? 'border-angaly-navy' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <Image src={mediaItem.url} alt={mediaItem.altText || product.name} width={96} height={128} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="relative w-full flex-grow">
        {activeMedia ? (
          <button type="button" aria-label="Agrandir l'image" onClick={open} className="relative block aspect-[3/4] w-full max-h-[85vh] overflow-hidden">
            <Image
              src={activeMedia.url}
              alt={activeMedia.altText || product.name}
              fill
              priority
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="object-cover object-center"
            />
          </button>
        ) : (
          <div aria-hidden="true" className="aspect-[3/4] w-full bg-gradient-to-br from-angaly-royal-navy to-angaly-navy-blue" />
        )}
      </div>

      <GalleryLightbox
        media={media}
        activeIndex={activeIndex}
        isOpen={isOpen}
        onClose={close}
        onNext={next}
        onPrevious={previous}
        altFallback={product.name}
      />
    </div>
  );
}
