import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSubmitDesignBrief } from '../hooks/useSubmitDesignBrief';
import { apiClient } from '@/lib/api-client';
import React from 'react';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

const queryClient = new QueryClient();
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useSubmitDesignBrief', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should save draft correctly', async () => {
    const mockResponse = { id: 'draft-123' };
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useSubmitDesignBrief('test-slug'), { wrapper });

    act(() => {
      void result.current.handleSaveDraft({
        options: { coupe: 'Droite' },
        inspirationMediaIds: [],
      });
    });

    await waitFor(() => {
      expect(result.current.draftId).toBe('draft-123');
    });

    expect(apiClient.post).toHaveBeenCalledWith('/quotes/design-briefs', {
      options: { coupe: 'Droite' },
      inspirationMediaIds: [],
      creationSlug: 'test-slug',
      status: 'DRAFT',
    });
  });

  it('should submit correctly', async () => {
    const mockResponse = { id: 'draft-123' };
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useSubmitDesignBrief('test-slug'), { wrapper });

    act(() => {
      void result.current.handleSubmit({
        options: { coupe: 'Droite' },
        inspirationMediaIds: [],
      });
    });

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/quotes/design-briefs', {
        options: { coupe: 'Droite' },
        inspirationMediaIds: [],
        creationSlug: 'test-slug',
        status: 'SUBMITTED',
      });
    });
  });
});
