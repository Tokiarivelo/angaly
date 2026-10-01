'use client';

import React from 'react';
import Image from 'next/image';
import { Check, Video } from 'lucide-react';

import { formatFileSize } from '@/lib/utils';

import type { MediaItemDto } from '../types/media-item.types';

interface MediaListViewProps {
  items: MediaItemDto[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onOpen: (id: string) => void;
}

/** Compact row layout for the "Vue liste" toggle — same data/actions as `MediaGrid`, denser for scanning many files. */
export const MediaListView: React.FC<MediaListViewProps> = ({ items, selectedIds, onToggleSelect, onOpen }) => {
  return (
    <ul className="divide-y divide-angaly-border border border-angaly-border rounded-sm overflow-hidden bg-white shadow-2xs">
      {items.map((media) => {
        const isSelected = selectedIds.has(media.id);
        const isVideo = media.mimeType.startsWith('video/');
        const label = media.altText ?? media.id;

        return (
          <li
            key={media.id}
            className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
              isSelected ? 'bg-angaly-ivory/80 border-l-2 border-l-angaly-gold' : 'hover:bg-angaly-ivory/30'
            }`}
          >
            <button
              type="button"
              role="checkbox"
              aria-checked={isSelected}
              aria-label={`Sélectionner ${label}`}
              onClick={() => onToggleSelect(media.id)}
              className={`shrink-0 w-5 h-5 rounded-sm border transition-all flex items-center justify-center cursor-pointer ${
                isSelected
                  ? 'bg-angaly-gold border-angaly-gold text-white shadow-xs'
                  : 'border-angaly-border bg-white hover:border-angaly-gold'
              }`}
            >
              {isSelected && <Check size={12} strokeWidth={3} className="text-white" />}
            </button>

            <button
              type="button"
              onClick={() => onOpen(media.id)}
              aria-label={`Ouvrir le détail de ${label}`}
              className="flex flex-1 items-center gap-3 min-w-0 text-left cursor-pointer group"
            >
              <span className="relative shrink-0 w-10 h-10 rounded-sm bg-angaly-ivory border border-angaly-border/50 overflow-hidden">
                {isVideo ? (
                  <span className="w-full h-full flex items-center justify-center">
                    <Video className="text-angaly-slate" size={16} />
                  </span>
                ) : (
                  <Image src={media.url} alt="" fill sizes="40px" className="object-cover" />
                )}
              </span>
              <span className="flex-1 min-w-0 text-xs font-medium text-angaly-navy truncate group-hover:text-angaly-gold transition-colors">
                {label}
              </span>
              <span className="shrink-0 text-xs text-angaly-slate w-20 text-right font-mono">{formatFileSize(media.sizeBytes)}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
};
