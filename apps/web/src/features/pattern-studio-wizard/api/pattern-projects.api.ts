import { apiClient } from '@/lib/api-client';
import { MediaEntityType } from '@angaly/types';
import type {
  AiProviderId,
  GarmentProfile,
  InspirationAnalysisSnapshot,
  PatternAiSuggestionResponse,
  PatternExtParameters,
  PatternProjectDto,
  PatternVersionDto,
} from '@angaly/types';

export interface UpdatePatternProjectPayload {
  garmentType?: string | undefined;
  occasion?: string | undefined;
  style?: string | undefined;
  cutType?: string | undefined;
  detailsJson?: Record<string, string> | undefined;
  inspirationMediaId?: string | undefined;
  /** Observations + garment profile, kept on the project so generation can use them. */
  inspirationAnalysisJson?: InspirationAnalysisSnapshot | undefined;
  measurementProfileId?: string | undefined;
  /** Ease / fullness / lengths; `{}` resets to the engine defaults. */
  parametersExtJson?: PatternExtParameters | undefined;
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
  payload?: {
    measurements?: Record<string, number> | undefined;
    aiProvider?: AiProviderId | undefined;
  },
): Promise<PatternVersionDto> => {
  const res = await apiClient.post<PatternVersionDto | { data: PatternVersionDto }>(
    `/api/pattern-projects/${id}/generate`,
    payload,
  );
  return 'data' in res ? res.data : res;
};

interface PresignedUploadResponse {
  bucket: string;
  objectKey: string;
  uploadUrl: string;
  expiresInSeconds: number;
}

interface ConfirmUploadResponse {
  id: string;
  url: string;
}

/**
 * Presigned-upload → direct browser PUT to MinIO → confirm, the same
 * pattern already proven in `personnalisation-creation`'s
 * `useInspirationUpload.ts` — never a raw `fetch` against our own API
 * (`@/lib/api-client` is the only place allowed to, see its docblock /
 * .cursor/rules/002-nextjs-features.mdc), and never a silent fallback to a
 * local `URL.createObjectURL()` blob standing in for a real upload: that
 * blob never survives a page reload and was masking a real failure
 * (`entityType: 'PATTERN_PROJECT'` isn't a valid `MediaEntityType`, and
 * `/api/media/upload` isn't a route this app exposes — every upload was
 * silently failing before this fix, see docs/features/patterns.md).
 */
export const uploadInspirationMedia = async (
  file: File,
): Promise<{ mediaId: string; url: string }> => {
  const presigned = await apiClient.post<PresignedUploadResponse>('/media/presigned-upload', {
    entityType: MediaEntityType.PATTERN_INSPIRATION,
    originalFilename: file.name,
    mimeType: file.type,
  });

  const uploadResponse = await fetch(presigned.uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  });
  if (!uploadResponse.ok) {
    throw new Error('Le téléversement de la photo vers le stockage a échoué');
  }

  const media = await apiClient.post<ConfirmUploadResponse>('/media/confirm', {
    bucket: presigned.bucket,
    objectKey: presigned.objectKey,
    entityType: MediaEntityType.PATTERN_INSPIRATION,
    altText: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
  });

  return { mediaId: media.id, url: media.url };
};

export interface RequestPatternSuggestionPayload {
  garmentType: string;
  occasion: string | null;
  style: string | null;
  measurements?: Record<string, number>;
  aiProvider?: AiProviderId | undefined;
}

export const requestPatternSuggestion = async (
  payload: RequestPatternSuggestionPayload,
): Promise<{ suggestion: PatternAiSuggestionResponse; isIndicativeOnly: boolean }> => {
  try {
    return await apiClient.post<{ suggestion: PatternAiSuggestionResponse; isIndicativeOnly: boolean }>(
      '/api/ai-inference/pattern-suggestions',
      { ...payload, measurements: payload.measurements ?? {} },
    );
  } catch {
    // Dégradation gracieuse : jamais bloquant, l'utilisateur garde la sélection manuelle.
    return {
      suggestion: {
        suggestedCutType: 'DROITE',
        suggestedDetails: {},
        detectedInspirationFeatures: null,
        confidence: 0,
        modelVersion: 'fallback-0.0.0',
      },
      isIndicativeOnly: true,
    };
  }
};

export interface InspirationAnalysis {
  suggestedCutType: string | null;
  detectedFeatures: Record<string, string>;
  /** Wizard-ready classification; null when the analysis is unavailable. */
  profile: GarmentProfile | null;
  confidence: number;
  /** The chosen model could not answer (e.g. local model: no vision) and a fallback model did. */
  usedFallback?: boolean;
  modelUsed?: string | null;
}

export const analyzeInspirationPhoto = async (
  imageUrl: string,
  aiProvider?: AiProviderId,
): Promise<InspirationAnalysis> => {
  try {
    // Field names must match AnalyzeInspirationDto/AiInspirationController exactly
    // (apps/api/src/ai-inference/presentation/controllers/ai-inspiration.controller.ts).
    const res = await apiClient.post<{
      suggestedCutType: string | null;
      detectedInspirationFeatures: Record<string, string>;
      profile: GarmentProfile | null;
      confidence: number;
      isIndicativeOnly: boolean;
      usedFallback?: boolean;
      modelUsed?: string | null;
    }>('/api/ai-inference/inspiration-analysis', {
      inspirationImageUrl: imageUrl,
      ...(aiProvider ? { aiProvider } : {}),
    });
    return {
      suggestedCutType: res.suggestedCutType,
      detectedFeatures: res.detectedInspirationFeatures ?? {},
      profile: res.profile ?? null,
      confidence: res.confidence,
      usedFallback: res.usedFallback ?? false,
      modelUsed: res.modelUsed ?? null,
    };
  } catch {
    // No invented analysis: the customer simply fills the following steps by hand.
    return { suggestedCutType: null, detectedFeatures: {}, profile: null, confidence: 0 };
  }
};
