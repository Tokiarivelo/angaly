'use client';

import React from 'react';
import Image from 'next/image';
import { Video } from 'lucide-react';

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
    <ul className="divide-y divide-border border border-border rounded-lg overflow-hidden bg-white">
      {items.map((media) => {
        const isSelected = selectedIds.has(media.id);
        const isVideo = media.mimeType.startsWith('video/');
        const label = media.altText ?? media.id;

        return (
          <li key={media.id} className={`flex items-center gap-3 px-3 py-2 ${isSelected ? 'bg-angaly-navy/5' : ''}`}>
            <button
              type="button"
              role="checkbox"
              aria-checked={isSelected}
              aria-label={`Sélectionner ${label}`}
              onClick={() => onToggleSelect(media.id)}
              className="shrink-0 w-5 h-5 rounded border border-border bg-white flex items-center justify-center"
            >
              {isSelected && <span className="w-3 h-3 rounded-sm bg-angaly-navy" />}
            </button>

            <button
              type="button"
              onClick={() => onOpen(media.id)}
              aria-label={`Ouvrir le détail de ${label}`}
              className="flex flex-1 items-center gap-3 min-w-0 text-left"
            >
              <span className="relative shrink-0 w-10 h-10 rounded bg-angaly-warm-ivory overflow-hidden">
                {isVideo ? (
                  <span className="w-full h-full flex items-center justify-center">
                    <Video className="text-angaly-slate" size={16} />
                  </span>
                ) : (
                  <Image src={media.url} alt="" fill sizes="40px" className="object-cover" />
                )}
              </span>
              <span className="flex-1 min-w-0 text-sm text-angaly-navy truncate">{label}</span>
              <span className="shrink-0 text-xs text-angaly-slate w-16 text-right">{formatFileSize(media.sizeBytes)}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
};
