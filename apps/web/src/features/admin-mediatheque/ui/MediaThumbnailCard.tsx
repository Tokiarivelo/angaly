'use client';

import React from 'react';
import Image from 'next/image';
import { Video } from 'lucide-react';

import { formatFileSize } from '@/lib/utils';

import type { MediaItemDto } from '../types/media-item.types';

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
  const label = media.altText ?? media.id;

  return (
    <div
      className={`relative group border rounded-lg overflow-hidden bg-white transition-colors ${
        isSelected ? 'border-angaly-navy ring-1 ring-angaly-navy' : 'border-border'
      }`}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={isSelected}
        aria-label={`Sélectionner ${label}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelect();
        }}
        className="absolute top-2 left-2 z-10 w-5 h-5 rounded border border-white bg-white/80 flex items-center justify-center"
      >
        {isSelected && <span className="w-3 h-3 rounded-sm bg-angaly-navy" />}
      </button>

      <button
        type="button"
        onClick={onOpen}
        aria-label={`Ouvrir le détail de ${label}`}
        className="block w-full aspect-square bg-angaly-warm-ivory relative cursor-pointer"
      >
        {isVideo ? (
          <div className="w-full h-full flex items-center justify-center">
            <Video className="text-angaly-slate" size={28} />
          </div>
        ) : (
          <Image src={media.url} alt={media.altText ?? ''} fill sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw" className="object-cover" />
        )}
        <span className="absolute bottom-1.5 right-1.5 text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-white">
          {formatFileSize(media.sizeBytes)}
        </span>
      </button>

      <p className="px-2 py-1.5 text-xs text-angaly-slate truncate">{label}</p>
    </div>
  );
};
