import React, { useRef } from 'react';
import { Upload, X } from 'lucide-react';

interface InspirationUploadDropzoneProps {
  previews: { id: string; url: string; file: File }[];
  isUploading: boolean;
  onUpload: (files: File[]) => void | Promise<void>;
  onRemove: (id: string) => void;
}

export const InspirationUploadDropzone: React.FC<InspirationUploadDropzoneProps> = ({
  previews,
  isUploading,
  onUpload,
  onRemove,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      void onUpload(Array.from(e.target.files));
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="mb-8">
      <h3 className="font-serif text-xl text-primary-deep-navy mb-4">Ajouter une photo d'inspiration (optionnel)</h3>
      <div
        className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center hover:border-champagne transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="text-primary-deep-navy mb-2" size={24} />
        <p className="text-sm text-primary-deep-navy mb-1 text-center">Formats acceptés : JPG, PNG — 10 Mo max</p>
        {isUploading && <p className="text-sm text-slate">Téléchargement en cours...</p>}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg, image/png"
          className="hidden"
          multiple
        />
      </div>

      {previews.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-4">
          {previews.map((preview) => (
            <div key={preview.id} className="relative w-20 h-20 rounded-md overflow-hidden border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview.url} alt={preview.file.name} className="w-full h-full object-cover" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(preview.id);
                }}
                className="absolute top-1 right-1 bg-white/80 rounded-full p-1 hover:bg-white transition-colors"
                title="Supprimer"
              >
                <X size={12} className="text-primary-deep-navy" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
