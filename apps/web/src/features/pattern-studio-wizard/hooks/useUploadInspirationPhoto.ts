'use client';

import { useState } from 'react';
import { uploadInspirationMedia, analyzeInspirationPhoto } from '../api/pattern-projects.api';

export const useUploadInspirationPhoto = (
  onSuccess: (data: {
    mediaId: string;
    url: string;
    detectedFeatures: Record<string, string>;
    suggestedCutType: string;
  }) => void,
) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadAndAnalyze = async (file: File) => {
    try {
      setIsUploading(true);
      setError(null);

      const { mediaId, url } = await uploadInspirationMedia(file);
      setIsUploading(false);

      setIsAnalyzing(true);
      const analysis = await analyzeInspirationPhoto(url);
      setIsAnalyzing(false);

      onSuccess({
        mediaId,
        url,
        detectedFeatures: analysis.detectedFeatures,
        suggestedCutType: analysis.suggestedCutType,
      });
    } catch (err) {
      setIsUploading(false);
      setIsAnalyzing(false);
      setError('Impossible de traiter la photo. Vous pouvez continuer sans photo.');
    }
  };

  return {
    uploadAndAnalyze,
    isUploading,
    isAnalyzing,
    error,
  };
};
