import { AiProviderId } from '@angaly/types';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MediaEntityType } from '@angaly/types';
import { apiClient } from '@/lib/api-client';
import { analyzeInspirationPhoto, uploadInspirationMedia } from '../api/pattern-projects.api';

vi.mock('@/lib/api-client');

describe('uploadInspirationMedia', () => {
  const file = new File(['fake-image-bytes'], 'inspiration.jpg', { type: 'image/jpeg' });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requests a presigned URL with a valid MediaEntityType, PUTs to it directly, then confirms', async () => {
    vi.mocked(apiClient.post)
      .mockResolvedValueOnce({
        bucket: 'patterns',
        objectKey: 'inspiration-1.jpg',
        uploadUrl: 'https://minio.local/patterns/inspiration-1.jpg?signature=abc',
        expiresInSeconds: 900,
      })
      .mockResolvedValueOnce({ id: 'media-1', url: 'https://minio.local/patterns/inspiration-1.jpg' });
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 200 }));

    const result = await uploadInspirationMedia(file);

    expect(apiClient.post).toHaveBeenNthCalledWith(1, '/media/presigned-upload', {
      entityType: MediaEntityType.PATTERN_INSPIRATION,
      originalFilename: 'inspiration.jpg',
      mimeType: 'image/jpeg',
    });
    expect(fetch).toHaveBeenCalledWith(
      'https://minio.local/patterns/inspiration-1.jpg?signature=abc',
      expect.objectContaining({ method: 'PUT', body: file }),
    );
    expect(apiClient.post).toHaveBeenNthCalledWith(2, '/media/confirm', {
      bucket: 'patterns',
      objectKey: 'inspiration-1.jpg',
      entityType: MediaEntityType.PATTERN_INSPIRATION,
      altText: 'inspiration.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: file.size,
    });
    expect(result).toEqual({ mediaId: 'media-1', url: 'https://minio.local/patterns/inspiration-1.jpg' });
  });

  it('throws (never falls back to a local blob URL) when the direct PUT to storage fails', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      bucket: 'patterns',
      objectKey: 'inspiration-1.jpg',
      uploadUrl: 'https://minio.local/patterns/inspiration-1.jpg?signature=abc',
      expiresInSeconds: 900,
    });
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 403 }));

    await expect(uploadInspirationMedia(file)).rejects.toThrow(
      'Le téléversement de la photo vers le stockage a échoué',
    );
    expect(apiClient.post).toHaveBeenCalledTimes(1); // never reaches /media/confirm
  });

  it('propagates a presigned-upload request failure instead of swallowing it', async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('network error'));

    await expect(uploadInspirationMedia(file)).rejects.toThrow('network error');
  });
});

const PROFILE = {
  isGarment: true,
  garmentType: 'ROBE',
  occasion: 'SOIREE',
  style: 'ELEGANT',
  cutType: 'PRINCESSE',
  details: { longueur: 'SOL' },
};

describe('analyzeInspirationPhoto', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends inspirationImageUrl (not imageUrl) and maps detectedInspirationFeatures to detectedFeatures', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      suggestedCutType: 'PRINCESSE',
      detectedInspirationFeatures: { silhouette: 'Évasée' },
      profile: PROFILE,
      confidence: 0.82,
      isIndicativeOnly: false,
    });

    const result = await analyzeInspirationPhoto('https://minio.local/patterns/inspiration-1.jpg');

    expect(apiClient.post).toHaveBeenCalledWith('/api/ai-inference/inspiration-analysis', {
      inspirationImageUrl: 'https://minio.local/patterns/inspiration-1.jpg',
    });
    expect(result).toEqual({
      suggestedCutType: 'PRINCESSE',
      detectedFeatures: { silhouette: 'Évasée' },
      profile: PROFILE,
      confidence: 0.82,
    });
  });

  it('sends the model chosen in the wizard, and nothing when the atelier setting applies', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      suggestedCutType: null,
      detectedInspirationFeatures: {},
      profile: null,
      confidence: 0,
      isIndicativeOnly: true,
    });

    await analyzeInspirationPhoto('https://minio.local/p.jpg', AiProviderId.ANTHROPIC);
    expect(apiClient.post).toHaveBeenLastCalledWith('/api/ai-inference/inspiration-analysis', {
      inspirationImageUrl: 'https://minio.local/p.jpg',
      aiProvider: 'ANTHROPIC',
    });

    await analyzeInspirationPhoto('https://minio.local/p.jpg');
    expect(apiClient.post).toHaveBeenLastCalledWith('/api/ai-inference/inspiration-analysis', {
      inspirationImageUrl: 'https://minio.local/p.jpg',
    });
  });

  it('returns an empty analysis, never an invented one, when the request fails', async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('network error'));

    const result = await analyzeInspirationPhoto('https://minio.local/patterns/inspiration-1.jpg');

    expect(result).toEqual({
      suggestedCutType: null,
      detectedFeatures: {},
      profile: null,
      confidence: 0,
    });
  });
});
