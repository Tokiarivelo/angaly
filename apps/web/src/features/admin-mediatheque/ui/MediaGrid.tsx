'use client';

import React from 'react';

import type { MediaItemDto } from '../types/media-item.types';
import { MediaThumbnailCard } from './MediaThumbnailCard';

interface MediaGridProps {
  items: MediaItemDto[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onOpen: (id: string) => void;
}

export const MediaGrid: React.FC<MediaGridProps> = ({ items, selectedIds, onToggleSelect, onOpen }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {items.map((media) => (
        <MediaThumbnailCard
          key={media.id}
          media={media}
          isSelected={selectedIds.has(media.id)}
          onToggleSelect={() => onToggleSelect(media.id)}
          onOpen={() => onOpen(media.id)}
        />
      ))}
    </div>
  );
};
