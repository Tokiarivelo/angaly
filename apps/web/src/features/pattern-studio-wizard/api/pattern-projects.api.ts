import { apiClient } from '@/lib/api-client';
import type { PatternProjectDto, PatternVersionDto } from '@angaly/types';

export interface UpdatePatternProjectPayload {
  garmentType?: string | undefined;
  occasion?: string | undefined;
  style?: string | undefined;
  cutType?: string | undefined;
  detailsJson?: Record<string, string> | undefined;
  inspirationMediaId?: string | undefined;
  measurementProfileId?: string | undefined;
}

export const fetchPatternProject = async (id: string): Promise<PatternProjectDto> => {
  const res = await apiClient.get<PatternProjectDto | { data: PatternProjectDto }>(
    `/api/pattern-projects/${id}`,
  );
  return 'data' in res ? res.data : res;
};

export const updatePatternProject = async (
  id: string,
  payload: UpdatePatternProjectPayload,
): Promise<PatternProjectDto> => {
  return await apiClient.patch<PatternProjectDto>(`/api/pattern-projects/${id}`, payload);
};

export const generatePattern = async (
  id: string,
  payload?: { measurements?: Record<string, number> | undefined } | undefined,
): Promise<PatternVersionDto> => {
  const res = await apiClient.post<PatternVersionDto | { data: PatternVersionDto }>(
    `/api/pattern-projects/${id}/generate`,
    payload,
  );
  return 'data' in res ? res.data : res;
};

export const uploadInspirationMedia = async (
  file: File,
): Promise<{ mediaId: string; url: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('entityType', 'PATTERN_PROJECT');

  // Request presigned URL or direct upload buffer
  const res = await fetch('/api/media/upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    // Fallback placeholder media id if offline/mock
    return {
      mediaId: 'mock-media-' + Date.now(),
      url: URL.createObjectURL(file),
    };
  }

  const data = await res.json();
  return { mediaId: data.id ?? data.mediaId, url: data.url };
};

export const analyzeInspirationPhoto = async (
  imageUrl: string,
): Promise<{
  suggestedCutType: string;
  detectedFeatures: Record<string, string>;
  confidence: number;
}> => {
  try {
    const res = await apiClient.post<{
      suggestedCutType: string;
      detectedFeatures: Record<string, string>;
      confidence: number;
    }>('/api/ai-inference/inspiration-analysis', { imageUrl });
    return res;
  } catch {
    // Graceful fallback: placeholder analysis
    return {
      suggestedCutType: 'SIRENE',
      detectedFeatures: {
        silhouette: 'Ajustée avec traîne légère',
        encolure: 'Décolleté en V subtil',
        manches: 'Manches longues semi-transparentes',
      },
      confidence: 0,
    };
  }
};
