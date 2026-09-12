import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useExportPattern } from '../hooks/useExportPattern';
import { withQueryClient } from '@/lib/test-utils';
import { apiClient } from '@/lib/api-client';
import { PatternExportFormat } from '@angaly/types';

vi.mock('@/lib/api-client');

describe('useExportPattern', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('triggers export mutation with selected format', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      id: 'exp-1',
      versionId: 'ver-123',
      format: PatternExportFormat.PDF_A4,
      mediaId: 'med-1',
      mediaUrl: 'https://storage.angaly.com/export.pdf',
    });

    const { result } = renderHook(() => useExportPattern('proj-1', 'ver-123'), {
      wrapper: withQueryClient(),
    });

    act(() => {
      result.current.mutate(PatternExportFormat.PDF_A4);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/pattern-versions/ver-123/export',
      { format: PatternExportFormat.PDF_A4 },
    );
  });
});
