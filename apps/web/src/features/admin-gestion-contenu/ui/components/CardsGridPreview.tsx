import React from 'react';
import Image from 'next/image';

interface CardItem {
  label?: string | null | undefined;
  title?: string | null | undefined;
  imageUrl?: string | null | undefined;
  imageAlt?: string | null | undefined;
  href?: string | null | undefined;
}

interface CardsGridPreviewProps {
  title?: string | null | undefined;
  subtitle?: string | null | undefined;
  items?: CardItem[] | undefined;
  isCompact?: boolean;
}

const DEFAULT_CARDS: CardItem[] = [
  {
    label: 'Mariage',
    title: 'Mariage',
    imageUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&q=80&fm=jpg',
    imageAlt: 'Univers Robes de mariée',
  },
  {
    label: 'Costumes',
    title: 'Costumes',
    imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80&fm=jpg',
    imageAlt: 'Univers Costumes homme sur mesure',
  },
  {
    label: 'Soirée',
    title: 'Soirée',
    imageUrl: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&q=80&fm=jpg',
    imageAlt: 'Univers Robes de soirée',
  },
  {
    label: 'Sur Mesure',
    title: 'Sur Mesure',
    imageUrl: 'https://images.unsplash.com/photo-1520006403909-838d6b92c22e?w=800&q=80&fm=jpg',
    imageAlt: 'Univers Confection sur mesure',
  },
];

export const CardsGridPreview: React.FC<CardsGridPreviewProps> = ({
  title = 'Univers',
  subtitle,
  items,
  isCompact = false,
}) => {
  const displayItems = (items && items.length > 0 ? items : DEFAULT_CARDS).slice(0, 4);

  return (
    <section
      data-testid="cards-grid-preview"
      className="bg-angaly-ivory p-6 sm:p-10 border border-angaly-border rounded-sm text-center"
    >
      <div className="mb-8">
        {subtitle && (
          <p className="text-[10px] sm:text-xs tracking-[0.3em] text-angaly-slate uppercase font-semibold mb-2">
            {subtitle}
          </p>
        )}
        <h2 className="font-heading text-2xl sm:text-4xl text-angaly-navy">
          {title || 'Univers'}
        </h2>
      </div>

      <div
        className={`grid gap-4 sm:gap-6 ${
          isCompact ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'
        }`}
      >
        {displayItems.map((item, idx) => {
          const imgUrl = item.imageUrl || DEFAULT_CARDS[idx % DEFAULT_CARDS.length]?.imageUrl!;
          return (
            <div
              key={idx}
              className="group relative aspect-[3/4] overflow-hidden rounded-xs bg-angaly-navy shadow-xs transition-transform duration-500"
            >
              <Image
                src={imgUrl}
                alt={item.imageAlt ?? item.label ?? `Carte ${idx + 1}`}
                fill
                sizes="(min-width: 768px) 25vw, 50vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105 opacity-85"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-angaly-navy via-angaly-navy/30 to-transparent"
              />
              <div className="absolute inset-x-0 bottom-0 p-4 text-center">
                <span className="font-heading text-lg sm:text-xl text-white tracking-wide block">
                  {item.label ?? item.title ?? `Univers ${idx + 1}`}
                </span>
                <span className="mt-1 text-[9px] uppercase tracking-widest text-angaly-champagne font-medium block">
                  Découvrir
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
