import React from 'react';
import Image from 'next/image';

interface GalleryItem {
  title?: string | null | undefined;
  description?: string | null | undefined;
  imageUrl?: string | null | undefined;
  imageAlt?: string | null | undefined;
}

interface GalleryMosaicPreviewProps {
  title?: string | null | undefined;
  subtitle?: string | null | undefined;
  items?: GalleryItem[] | undefined;
}

const DEFAULT_GALLERY: GalleryItem[] = [
  {
    title: 'Broderie main',
    description: 'Fil d’or et perles',
    imageUrl: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&q=80&fm=jpg',
    imageAlt: 'Détail de broderie manuelle',
  },
  {
    title: 'Patronage millimétré',
    description: 'Tracé sur toile',
    imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80&fm=jpg',
    imageAlt: 'Patronage sur toile',
  },
  {
    title: 'Étoffes nobles',
    description: 'Soies sauvages et dentelles',
    imageUrl: 'https://images.unsplash.com/photo-1520006403909-838d6b92c22e?w=800&q=80&fm=jpg',
    imageAlt: 'Étoffes de haute qualité',
  },
];

export const GalleryMosaicPreview: React.FC<GalleryMosaicPreviewProps> = ({
  title = 'L’Atelier en Images',
  subtitle = 'COULISSES DE LA MAISON',
  items,
}) => {
  const displayItems = items && items.length > 0 ? items : DEFAULT_GALLERY;

  return (
    <section
      data-testid="gallery-mosaic-preview"
      className="bg-angaly-ivory p-6 sm:p-10 border border-angaly-border rounded-sm text-center"
    >
      <div className="mb-6">
        {subtitle && (
          <p className="text-[10px] sm:text-xs tracking-[0.3em] text-angaly-slate uppercase font-semibold mb-1">
            {subtitle}
          </p>
        )}
        <h2 className="font-heading text-2xl sm:text-3xl text-angaly-navy">
          {title}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {displayItems.slice(0, 3).map((item, idx) => (
          <div key={idx} className="relative aspect-[4/5] overflow-hidden rounded-xs bg-angaly-navy/10 group">
            {item.imageUrl && (
              <Image
                src={item.imageUrl}
                alt={item.imageAlt ?? item.title ?? 'Atelier'}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-angaly-navy/80 via-transparent to-transparent opacity-90" />
            <div className="absolute inset-x-0 bottom-0 p-4 text-left">
              {item.title && (
                <p className="font-heading text-base sm:text-lg text-white font-medium">
                  {item.title}
                </p>
              )}
              {item.description && (
                <p className="text-[11px] text-angaly-champagne uppercase tracking-wider">
                  {item.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
