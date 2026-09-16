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
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 border-2 border-dashed border-angaly-champagne rounded-xl bg-angaly-champagne/5">
      <UploadCloud className="text-angaly-champagne mb-4" size={40} />
      <p className="text-angaly-navy font-medium mb-1">Glissez vos fichiers ici ou cliquez pour importer</p>
      <p className="text-xs text-angaly-slate mb-6">JPG, PNG, WebP, MP4 — 20 Mo max</p>
      <MediaUploadDropzone onFilesSelected={onFilesSelected} isUploading={isUploading} />
    </div>
  );
};
