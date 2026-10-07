import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { withQueryClient } from '@/lib/test-utils';
import { useAiRouting } from '../hooks/useAiRouting';
import * as api from '../api/ai-providers.api';
import { AiProviderId, type AiRoutingSetting } from '@angaly/types';

describe('useAiRouting', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches current routing settings', async () => {
    const mockRouting: AiRoutingSetting = {
      measurementProvider: AiProviderId.LOCAL_STATISTICAL,
      patternSuggestionProvider: AiProviderId.GEMINI,
      updatedAt: new Date().toISOString(),
      updatedById: 'admin-1',
    };

    vi.spyOn(api, 'fetchAiRouting').mockResolvedValue(mockRouting);

    const { result } = renderHook(() => useAiRouting(), {
      wrapper: withQueryClient(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.measurementProvider).toBe(AiProviderId.LOCAL_STATISTICAL);
    expect(result.current.data?.patternSuggestionProvider).toBe(AiProviderId.GEMINI);
  });
});
