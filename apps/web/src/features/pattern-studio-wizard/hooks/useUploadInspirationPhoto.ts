'use client';

import { useState } from 'react';
import type { AiProviderId, GarmentProfile } from '@angaly/types';
import { uploadInspirationMedia, analyzeInspirationPhoto } from '../api/pattern-projects.api';

export const useUploadInspirationPhoto = (
  onSuccess: (data: {
    mediaId: string;
    url: string;
    detectedFeatures: Record<string, string>;
    profile: GarmentProfile | null;
    suggestedCutType: string | null;
  }) => void,
  aiProvider?: AiProviderId,
) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = async (mediaId: string, url: string) => {
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeInspirationPhoto(url, aiProvider);
      onSuccess({
        mediaId,
        url,
        detectedFeatures: analysis.detectedFeatures,
        profile: analysis.profile,
        suggestedCutType: analysis.suggestedCutType,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const uploadAndAnalyze = async (file: File) => {
    try {
      setIsUploading(true);
      setError(null);

      const { mediaId, url } = await uploadInspirationMedia(file);
      setIsUploading(false);

      await analyze(mediaId, url);
    } catch {
      setIsUploading(false);
      setIsAnalyzing(false);
      setError('Impossible de traiter la photo. Vous pouvez continuer sans photo.');
    }
  };

  /** Runs the analysis again on the photo already uploaded (e.g. after choosing another model). */
  const reanalyze = async (mediaId: string, url: string) => {
    setError(null);
    await analyze(mediaId, url);
  };

  return {
    uploadAndAnalyze,
    reanalyze,
    isUploading,
    isAnalyzing,
    error,
  };
};
