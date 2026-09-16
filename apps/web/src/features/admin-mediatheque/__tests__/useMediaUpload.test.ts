import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MediaEntityType } from '@angaly/types';

import { useMediaUpload } from '../hooks/useMediaUpload';
import { withQueryClient } from '@/lib/test-utils';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client');

function makeFile(name: string, type = 'image/jpeg'): File {
  return new File(['fake-image-bytes'], name, { type });
}

class MockImage {
  naturalWidth = 800;
  naturalHeight = 600;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  set src(_value: string) {
    setTimeout(() => this.onload?.(), 0);
  }
}

describe('useMediaUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
    global.URL.createObjectURL = vi.fn(() => 'blob:mock');
    // @ts-expect-error test stub — jsdom's Image never fires onload/onerror on its own.
    global.Image = MockImage;
  });

  it('uploads a file through presigned-upload → PUT → confirm and marks it done', async () => {
    vi.mocked(apiClient.post).mockImplementation((path: string) => {
      if (path === '/api/media/presigned-upload') {
        return Promise.resolve({
          bucket: 'creations',
          objectKey: 'abc.jpg',
          uploadUrl: 'http://minio/creations/abc.jpg?sig=1',
          expiresInSeconds: 600,
        });
      }
      return Promise.resolve({ id: 'media-1' });
    });

    const { result } = renderHook(() => useMediaUpload(MediaEntityType.CREATION), { wrapper: withQueryClient() });

    await act(async () => {
      await result.current.uploadFiles([makeFile('robe.jpg')]);
    });

    await waitFor(() => expect(result.current.entries[0]?.status).toBe('done'));
    expect(result.current.entries[0]?.mediaId).toBe('media-1');
    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/media/presigned-upload',
      expect.objectContaining({ entityType: MediaEntityType.CREATION, originalFilename: 'robe.jpg' }),
    );
    expect(global.fetch).toHaveBeenCalledWith(
      'http://minio/creations/abc.jpg?sig=1',
      expect.objectContaining({ method: 'PUT' }),
    );
  });

  it('marks the entry as error when the presigned-upload call fails', async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('network error'));

    const { result } = renderHook(() => useMediaUpload(MediaEntityType.CREATION), { wrapper: withQueryClient() });

    await act(async () => {
      await result.current.uploadFiles([makeFile('robe.jpg')]);
    });

    await waitFor(() => expect(result.current.entries[0]?.status).toBe('error'));
  });
});
