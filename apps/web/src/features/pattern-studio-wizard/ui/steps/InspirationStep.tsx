'use client';

import React, { useRef } from 'react';
import { UploadCloud, Sparkles, CheckCircle2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useUploadInspirationPhoto } from '../../hooks/useUploadInspirationPhoto';

interface InspirationStepProps {
  inspirationImageUrl?: string | undefined;
  detectedFeatures?: Record<string, string> | undefined;
  onInspirationProcessed: (data: {
    mediaId: string;
    url: string;
    detectedFeatures: Record<string, string>;
    suggestedCutType: string;
  }) => void;
}

export const InspirationStep: React.FC<InspirationStepProps> = ({
  inspirationImageUrl,
  detectedFeatures,
  onInspirationProcessed,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadAndAnalyze, isUploading, isAnalyzing, error } =
    useUploadInspirationPhoto(onInspirationProcessed);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void uploadAndAnalyze(file);
    }
  };

  return (
    <div>
      <div className="mb-8 text-center sm:text-left">
        <h2 className="font-serif text-2xl sm:text-3xl text-white font-light mb-2">
          Ajoutez une photo d’inspiration (optionnel)
        </h2>
        <p className="text-[#D8D3C8] text-sm font-light">
          Notre système identifie des caractéristiques générales (coupe, manches, longueur, silhouette)
          pour orienter la conception — il ne reproduit pas une photo à l’identique.
        </p>
      </div>

      {/* Dropzone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-[#C5B190]/40 hover:border-[#C5B190] rounded-2xl p-8 bg-[#0C2650]/40 text-center cursor-pointer transition-all flex flex-col items-center justify-center group relative overflow-hidden"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />

        {isUploading || isAnalyzing ? (
          <div className="py-8 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-[#C5B190] animate-spin" />
            <p className="text-white text-sm font-medium">
              {isUploading ? 'Téléversement de votre image…' : 'Analyse stylistique des lignes en cours…'}
            </p>
            <p className="text-[#D8D3C8] text-xs font-light">
              Extraction des proportions et volumes
            </p>
          </div>
        ) : inspirationImageUrl ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-32 h-32 rounded-xl overflow-hidden border border-[#C5B190] relative shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={inspirationImageUrl}
                alt="Inspiration"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-xs text-[#C5B190] hover:underline flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" /> Changer la photo d’inspiration
            </p>
          </div>
        ) : (
          <div className="py-6 flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#041329] border border-[#C5B190]/30 flex items-center justify-center text-[#C5B190] group-hover:scale-110 transition-transform">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-white font-medium text-sm">
                Glissez une image ici ou cliquez pour parcourir
              </p>
              <p className="text-[#D8D3C8]/60 text-xs mt-1">
                Formats acceptés : PNG, JPG, WebP jusqu’à 10 Mo
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-amber-300 mt-2 italic">{error}</p>
      )}

      {/* Analysis results chip list */}
      {detectedFeatures && Object.keys(detectedFeatures).length > 0 && (
        <div className="mt-6 p-5 rounded-xl bg-[#0C2650] border border-[#C5B190]/30">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 text-white text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-[#C5B190]" />
              <span>Caractéristiques détectées (suggestions indicatives)</span>
            </div>
            <span className="text-[10px] text-[#C5B190]/70 bg-[#041329] px-2 py-0.5 rounded border border-[#C5B190]/20">
              Modèle Phase 4/5
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(detectedFeatures).map(([k, v]) => (
              <div
                key={k}
                className="flex items-center gap-2 text-xs bg-[#041329]/80 px-3 py-2 rounded-lg border border-[#C5B190]/10 text-[#D8D3C8]"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#C5B190] shrink-0" />
                <span className="font-medium text-white capitalize">{k} :</span>
                <span className="truncate">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
