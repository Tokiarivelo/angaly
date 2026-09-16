'use client';

import React from 'react';
import { Video } from 'lucide-react';

import type { MediaItemDto } from '../types/media-item.types';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

interface MediaThumbnailCardProps {
  media: MediaItemDto;
  isSelected: boolean;
  onToggleSelect: () => void;
  onOpen: () => void;
}

export const MediaThumbnailCard: React.FC<MediaThumbnailCardProps> = ({
  media,
  isSelected,
  onToggleSelect,
  onOpen,
}) => {
  const isVideo = media.mimeType.startsWith('video/');

  return (
    <div
      className={`relative group border rounded-lg overflow-hidden bg-white cursor-pointer transition-colors ${
        isSelected ? 'border-primary-deep-navy ring-1 ring-primary-deep-navy' : 'border-border'
      }`}
    >
      <button
        type="button"
        aria-label={`Sélectionner ${media.altText ?? media.id}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelect();
        }}
        className="absolute top-2 left-2 z-10 w-5 h-5 rounded border border-white bg-white/80 flex items-center justify-center"
      >
        {isSelected && <span className="w-3 h-3 rounded-sm bg-primary-deep-navy" />}
      </button>

      <div onClick={onOpen} className="aspect-square bg-ivory-warm relative">
        {isVideo ? (
          <div className="w-full h-full flex items-center justify-center">
            <Video className="text-slate" size={28} />
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={media.url} alt={media.altText ?? ''} className="w-full h-full object-cover" />
        )}
        <span className="absolute bottom-1.5 right-1.5 text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-white">
          {formatSize(media.sizeBytes)}
        </span>
      </div>

      <p className="px-2 py-1.5 text-xs text-slate truncate">{media.altText ?? media.id}</p>
    </div>
  );
};
