'use client';

import React from 'react';

import { MEDIA_FOLDERS } from '../consts/media-folders.const';

interface MediaFolderFilterChipsProps {
  activeFolderId: string;
  onChange: (folderId: string) => void;
}

export const MediaFolderFilterChips: React.FC<MediaFolderFilterChipsProps> = ({ activeFolderId, onChange }) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide" role="tablist" aria-label="Dossiers">
      {MEDIA_FOLDERS.map((folder) => {
        const isActive = folder.id === activeFolderId;
        return (
          <button
            key={folder.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(folder.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${
              isActive
                ? 'bg-angaly-navy text-white border-angaly-navy shadow-xs'
                : 'bg-white/80 hover:bg-white text-angaly-navy border-angaly-border hover:border-angaly-gold'
            }`}
          >
            {folder.label}
          </button>
        );
      })}
    </div>
  );
};
