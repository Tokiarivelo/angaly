import type { CreationDto } from '@angaly/types';

import type { GalleryView } from '../types/gallery.types';
import { CreationCard } from './CreationCard';
import { EmptyState } from './EmptyState';

/** Real Stitch screen's CSS multi-column masonry (`column-count`), not a CSS grid — `list` is this codebase's own single-column addition, not shown on the static mockup. */
export function GalleryGrid({ items, view }: { items: CreationDto[]; view: GalleryView }) {
  if (items.length === 0) {
    return <EmptyState />;
  }

  if (view === 'list') {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-12 px-8 md:px-16">
        {items.map((creation, index) => (
          <CreationCard key={creation.id} creation={creation} index={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="px-8 [column-gap:2rem] sm:[column-count:2] md:px-16 lg:[column-count:3]">
      {items.map((creation, index) => (
        <CreationCard key={creation.id} creation={creation} index={index} />
      ))}
    </div>
  );
}
