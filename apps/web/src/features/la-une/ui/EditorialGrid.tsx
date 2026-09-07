import type { LaUneItem } from '../types/la-une-item.types';
import { EditorialGridItem, type EditorialGridItemSize } from './EditorialGridItem';

/**
 * Real Stitch "La Une" screen: a 12-col grid, not a uniform e-commerce grid —
 * pairs of (large 7-col, small 5-col offset) items, any items beyond that
 * fall back to full-width (12-col) editorial cards.
 */
export function EditorialGrid({ items }: { items: LaUneItem[] }) {
  if (items.length === 0) {
    return (
      <p className="mx-8 py-12 text-center text-sm text-angaly-slate">
        Aucune création ne correspond à ce filtre pour le moment.
      </p>
    );
  }

  return (
    <section className="w-full px-4 py-16 md:px-8 md:py-24">
      <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-12 md:gap-12">
        {items.map((item, index) => (
          <EditorialGridItem key={item.id} item={item} size={sizeForIndex(index)} />
        ))}
      </div>
    </section>
  );
}

const RHYTHM: EditorialGridItemSize[] = ['large', 'small', 'full'];

function sizeForIndex(index: number): EditorialGridItemSize {
  return RHYTHM[index % RHYTHM.length]!;
}
