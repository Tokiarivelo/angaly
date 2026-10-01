'use client';

import React from 'react';
import Image from 'next/image';
import { Check, Eye, Video } from 'lucide-react';

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
      className={`relative group rounded-sm overflow-hidden bg-white transition-all shadow-2xs ${
        isSelected
          ? 'border-2 border-angaly-gold ring-0'
          : 'border border-angaly-border hover:border-angaly-navy/50'
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
        className={`absolute top-2 left-2 z-10 w-5 h-5 rounded-sm border transition-all flex items-center justify-center cursor-pointer ${
          isSelected
            ? 'bg-angaly-gold border-angaly-gold text-white shadow-xs'
            : 'border-angaly-border bg-white/90 backdrop-blur-xs text-transparent opacity-80 group-hover:opacity-100 hover:border-angaly-gold'
        }`}
      >
        {isSelected && <Check size={12} strokeWidth={3} className="text-white" />}
      </button>

      <button
        type="button"
        onClick={onOpen}
        aria-label={`Ouvrir le détail de ${label}`}
        className="block w-full aspect-square bg-angaly-ivory/60 relative cursor-pointer group/thumb"
      >
        {isVideo ? (
          <div className="w-full h-full flex items-center justify-center">
            <Video className="text-angaly-slate" size={28} />
          </div>
        ) : (
          <Image
            src={media.url}
            alt={media.altText ?? ''}
            fill
            sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover/thumb:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-angaly-navy/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
          <span className="bg-white/95 text-angaly-navy px-2.5 py-1 rounded-sm text-[11px] font-semibold uppercase tracking-wider shadow-sm flex items-center gap-1">
            <Eye size={12} />
            Aperçu
          </span>
        </div>
        <span className="absolute bottom-1.5 right-1.5 text-[10px] font-medium tracking-wider px-1.5 py-0.5 rounded-xs bg-angaly-navy/80 text-white backdrop-blur-xs">
          {formatFileSize(media.sizeBytes)}
        </span>
      </button>

      <div className="px-2.5 py-2 border-t border-angaly-border/40 bg-white">
        <p className="text-xs font-medium text-angaly-navy truncate">{label}</p>
      </div>
    </div>
  );
};
