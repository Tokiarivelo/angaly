'use client';

import React from 'react';
import { UploadCloud } from 'lucide-react';

import { MediaUploadDropzone } from './MediaUploadDropzone';

interface MediaEmptyStateProps {
  onFilesSelected: (files: FileList) => void;
  isUploading: boolean;
}

export const MediaEmptyState: React.FC<MediaEmptyStateProps> = ({ onFilesSelected, isUploading }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 border-2 border-dashed border-angaly-border hover:border-angaly-gold rounded-sm bg-white shadow-2xs transition-colors">
      <div className="w-14 h-14 rounded-full bg-angaly-ivory flex items-center justify-center mb-4 text-angaly-gold">
        <UploadCloud size={28} />
      </div>
      <p className="text-angaly-navy font-heading text-lg mb-1">Glissez vos fichiers ici ou cliquez pour importer</p>
      <p className="text-xs text-angaly-slate mb-6">JPG, PNG, WebP, MP4 — 20 Mo max</p>
      <MediaUploadDropzone onFilesSelected={onFilesSelected} isUploading={isUploading} />
    </div>
  );
};
