'use client';

import React from 'react';

import { MEDIA_FOLDERS } from '../consts/media-folders.const';

interface MediaFolderFilterChipsProps {
  activeFolderId: string;
  onChange: (folderId: string) => void;
}

export const MediaFolderFilterChips: React.FC<MediaFolderFilterChipsProps> = ({ activeFolderId, onChange }) => {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Dossiers">
      {MEDIA_FOLDERS.map((folder) => {
        const isActive = folder.id === activeFolderId;
        return (
          <button
            key={folder.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(folder.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              isActive
                ? 'bg-angaly-navy text-white border-angaly-navy'
                : 'bg-white text-angaly-slate border-border hover:border-angaly-navy/50'
            }`}
          >
            {folder.label}
          </button>
        );
      })}
    </div>
  );
};
