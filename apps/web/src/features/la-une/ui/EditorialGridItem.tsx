import Link from 'next/link';

import { formatDate } from '@/lib/utils';

import { contentTypeLabel } from '../consts/content-type-filters.const';
import type { LaUneItem } from '../types/la-une-item.types';

export type EditorialGridItemSize = 'large' | 'small' | 'full';

const ASPECT_BY_SIZE: Record<EditorialGridItemSize, string> = {
  large: 'aspect-[3/4]',
  small: 'aspect-[4/5]',
  full: 'aspect-[21/9]',
};

const TITLE_SIZE_BY_SIZE: Record<EditorialGridItemSize, string> = {
  large: 'text-3xl',
  small: 'text-2xl',
  full: 'text-3xl md:text-4xl',
};

/**
 * One card of the real Stitch "La Une" masonry grid — caption sits below
 * the image (not overlaid), unlike the homepage's La Une preview tiles.
 */
export function EditorialGridItem({ item, size }: { item: LaUneItem; size: EditorialGridItemSize }) {
  const label = contentTypeLabel(item.contentType);
  const isFull = size === 'full';

  return (
    <article
      className={`group flex flex-col ${isFull ? 'md:col-span-12 mt-8 md:mt-16' : size === 'small' ? 'md:col-span-5 md:mt-24' : 'md:col-span-7'}`}
    >
      <Link href={item.href} className={`relative mb-6 block w-full overflow-hidden bg-angaly-warm-ivory md:mb-8 ${ASPECT_BY_SIZE[size]}`}>
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-br from-angaly-royal-navy to-angaly-navy-blue transition-transform duration-700 group-hover:scale-105"
        />
      </Link>
      <div className={isFull ? 'mx-auto flex max-w-3xl flex-col items-center px-4 text-center' : 'flex flex-col items-start px-2'}>
        {label && <span className="text-angaly-slate mb-3 text-xs tracking-widest uppercase">{label}</span>}
        <h3 className={`font-heading group-hover:text-angaly-gold mb-4 text-angaly-navy transition-colors ${TITLE_SIZE_BY_SIZE[size]}`}>
          {item.title}
        </h3>
        <p className={`text-angaly-slate mb-6 leading-relaxed ${isFull ? 'text-base' : 'max-w-md text-sm'}`}>
          {item.description}
        </p>
        {item.date && <p className="text-angaly-warm-gray -mt-4 mb-6 text-xs">{formatDate(item.date)}</p>}
        {!isFull && (
          <Link
            href={item.href}
            className="group-hover:text-angaly-gold group-hover:border-angaly-gold inline-flex items-center border-b border-angaly-navy pb-1 text-sm tracking-widest text-angaly-navy uppercase transition-colors"
          >
            {size === 'large' ? 'Voir la création' : 'Découvrir'}
          </Link>
        )}
      </div>
    </article>
  );
}
