import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { analyzeInspirationPhoto } from '../api/pattern-projects.api';
import { useUploadInspirationPhoto } from '../hooks/useUploadInspirationPhoto';

vi.mock('../api/pattern-projects.api', () => ({
  uploadInspirationMedia: vi.fn(),
  analyzeInspirationPhoto: vi.fn(),
}));

const emptyAnalysis = { suggestedCutType: null, detectedFeatures: {}, profile: null, confidence: 0 };

describe('useUploadInspirationPhoto', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exposes that the AI service was unreachable, and clears it once an analysis gets through', async () => {
    vi.mocked(analyzeInspirationPhoto).mockResolvedValueOnce({ ...emptyAnalysis, aiServiceUnreachable: true });
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useUploadInspirationPhoto(onSuccess));

    await act(() => result.current.reanalyze('media-1', 'https://cdn/p.jpg'));
    expect(result.current.aiServiceUnreachable).toBe(true);
    expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({ mediaId: 'media-1', profile: null }));

    vi.mocked(analyzeInspirationPhoto).mockResolvedValueOnce(emptyAnalysis);
    await act(() => result.current.reanalyze('media-1', 'https://cdn/p.jpg'));
    expect(result.current.aiServiceUnreachable).toBe(false);
  });
});
