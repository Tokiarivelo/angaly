import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { withQueryClient } from '@/lib/test-utils';

import { useInspirationUpload } from '../hooks/useInspirationUpload';

function makeFile(name: string): File {
  return new File(['fake-image-bytes'], name, { type: 'image/jpeg' });
}

vi.mock('next-auth/react', () => ({
  getSession: () => Promise.resolve({ user: { id: 'user-1', role: 'CLIENT' }, accessToken: 'mock-access-token' }),
}));

beforeAll(() => {
  URL.createObjectURL = () => 'blob:mock';
});

describe('useInspirationUpload', () => {
  it('uploads a file through the presigned+confirm flow and exposes its media id', async () => {
    const { result } = renderHook(() => useInspirationUpload(), { wrapper: withQueryClient() });

    await act(async () => {
      await result.current.addFiles([makeFile('inspiration.jpg')]);
    });

    await waitFor(() => expect(result.current.photos[0]?.status).toBe('done'));
    expect(result.current.mediaIds).toEqual(['media-1']);
  });

  it('removes a photo from the list', async () => {
    const { result } = renderHook(() => useInspirationUpload(), { wrapper: withQueryClient() });

    await act(async () => {
      await result.current.addFiles([makeFile('inspiration.jpg')]);
    });
    await waitFor(() => expect(result.current.photos).toHaveLength(1));

    act(() => result.current.removePhoto(result.current.photos[0]!.id));

    expect(result.current.photos).toHaveLength(0);
  });

  it('caps additions at 5 photos and reports no room left', async () => {
    const { result } = renderHook(() => useInspirationUpload(), { wrapper: withQueryClient() });

    await act(async () => {
      await result.current.addFiles([1, 2, 3, 4, 5, 6].map((n) => makeFile(`photo-${n}.jpg`)));
    });

    await waitFor(() => expect(result.current.photos).toHaveLength(5));
    expect(result.current.canAddMore).toBe(false);
  });
});
