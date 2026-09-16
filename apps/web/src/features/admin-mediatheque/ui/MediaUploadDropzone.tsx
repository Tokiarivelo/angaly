'use client';

import React, { useRef } from 'react';
import { UploadCloud } from 'lucide-react';

interface MediaUploadDropzoneProps {
  onFilesSelected: (files: FileList) => void;
  isUploading: boolean;
}

export const MediaUploadDropzone: React.FC<MediaUploadDropzoneProps> = ({ onFilesSelected, isUploading }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,video/mp4"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onFilesSelected(e.target.files);
            e.target.value = '';
          }
        }}
      />
      <button
        type="button"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files.length > 0) {
            onFilesSelected(e.dataTransfer.files);
          }
        }}
        className="flex items-center gap-2 px-4 py-2 border border-dashed border-angaly-champagne rounded-lg text-sm font-medium text-angaly-navy hover:bg-angaly-champagne/10 transition-colors disabled:opacity-50"
      >
        <UploadCloud size={18} />
        {isUploading ? 'Import en cours…' : 'Importer des fichiers'}
      </button>
    </div>
  );
};
