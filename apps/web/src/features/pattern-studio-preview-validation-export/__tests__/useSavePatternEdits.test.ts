import { renderHook, act, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PatternPieceDto } from '@angaly/types';
import { toPieceInput, useSavePatternEdits } from '../hooks/useSavePatternEdits';
import { withQueryClient } from '@/lib/test-utils';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client');

const piece: PatternPieceDto = {
  id: 'draft-1',
  versionId: 'v1',
  name: '  ',
  dimensionsJson: { outlineMm: [] },
  fabricRecommendation: null,
  quantity: 2,
  grainlineJson: null,
  seamAllowanceCm: 1.5,
  notchesJson: [],
};

describe('useSavePatternEdits', () => {
  beforeEach(() => vi.clearAllMocks());

  it('strips ids and falls back to a name', () => {
    const input = toPieceInput(piece);
    expect(input).not.toHaveProperty('id');
    expect(input).not.toHaveProperty('versionId');
    expect(input.name).toBe('Pièce');
  });

  it('posts the pieces to the edits endpoint', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ id: 'v2' });
    const { result } = renderHook(() => useSavePatternEdits('proj-1'), { wrapper: withQueryClient() });
    act(() => result.current.mutate({ versionId: 'v1', pieces: [piece], changeLabel: 'Taille reprise' }));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.post).toHaveBeenCalledWith('/api/pattern-versions/v1/edits', {
      pieces: [toPieceInput(piece)],
      changeLabel: 'Taille reprise',
    });
  });
});
