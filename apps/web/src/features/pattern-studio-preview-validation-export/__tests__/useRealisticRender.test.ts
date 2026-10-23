import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RealisticRenderDto } from '@angaly/types';
import { REALISTIC_RENDER_POLL_MS, useRealisticRender } from '../hooks/useRealisticRender';
import { withQueryClient } from '@/lib/test-utils';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client');

const render = (overrides: Partial<RealisticRenderDto> = {}): RealisticRenderDto => ({
  id: 'r1',
  versionId: 'v1',
  pose: 'PRESENTATION',
  status: 'QUEUED',
  glbUrl: null,
  simPose: null,
  error: null,
  durationMs: null,
  cached: false,
  createdAt: '2026-10-16T10:00:00Z',
  finishedAt: null,
  ...overrides,
});

describe('useRealisticRender', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.useRealTimers());

  it('loads the latest render of the version in the pose', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: render({ status: 'DONE', glbUrl: 'https://cdn/x.glb' }) });
    const { result } = renderHook(() => useRealisticRender('v1', 'NEUTRE'), { wrapper: withQueryClient() });
    await waitFor(() => expect(result.current.render?.status).toBe('DONE'));
    expect(apiClient.get).toHaveBeenCalledWith('/api/pattern-versions/v1/realistic-render?pose=NEUTRE');
  });

  it('treats an empty answer as no render yet', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: null });
    const { result } = renderHook(() => useRealisticRender('v1', 'PRESENTATION'), { wrapper: withQueryClient() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.render).toBeNull();
  });

  it('does nothing without a version', () => {
    const { result } = renderHook(() => useRealisticRender(null, 'PRESENTATION'), { wrapper: withQueryClient() });
    expect(result.current.render).toBeNull();
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it('requests a render, then polls it by id until it is done', async () => {
    vi.mocked(apiClient.get)
      .mockResolvedValueOnce(null) // latest: none
      .mockResolvedValueOnce(render({ status: 'RUNNING' }))
      .mockResolvedValueOnce(render({ status: 'DONE', glbUrl: 'https://cdn/x.glb' }));
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: render() });
    const { result } = renderHook(() => useRealisticRender('v1', 'PRESENTATION'), { wrapper: withQueryClient() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.request.mutate());
    await waitFor(() => expect(result.current.render?.status).toBe('QUEUED'));
    expect(apiClient.post).toHaveBeenCalledWith('/api/pattern-versions/v1/realistic-render', { pose: 'PRESENTATION' });

    await waitFor(() => expect(result.current.render?.status).toBe('DONE'), { timeout: REALISTIC_RENDER_POLL_MS * 3 });
    expect(apiClient.get).toHaveBeenCalledWith('/api/pattern-versions/v1/realistic-render/r1');
  }, 20000);

  it('refuses to request without a version', async () => {
    const { result } = renderHook(() => useRealisticRender(null, 'PRESENTATION'), { wrapper: withQueryClient() });
    act(() => result.current.request.mutate());
    await waitFor(() => expect(result.current.request.isError).toBe(true));
    expect(apiClient.post).not.toHaveBeenCalled();
  });
});
