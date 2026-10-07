import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { withQueryClient } from '@/lib/test-utils';
import { AiProviderId } from '@angaly/types';
import * as api from '../api/ai-providers.api';
import { MODEL_SEARCH_DEBOUNCE_MS, useAiProviderModels } from '../hooks/useAiProviderModels';

describe('useAiProviderModels', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not fetch while disabled', () => {
    const spy = vi.spyOn(api, 'fetchAiProviderModels');
    renderHook(() => useAiProviderModels(AiProviderId.ANTHROPIC, '', false), {
      wrapper: withQueryClient(),
    });
    expect(spy).not.toHaveBeenCalled();
  });

  it('debounces the search term before calling the API', async () => {
    const spy = vi.spyOn(api, 'fetchAiProviderModels').mockResolvedValue({
      provider: AiProviderId.ANTHROPIC,
      models: [{ id: 'claude-sonnet-5-5' }],
      source: 'remote',
    });

    const { result, rerender } = renderHook(
      ({ q }) => useAiProviderModels(AiProviderId.ANTHROPIC, q, true),
      { wrapper: withQueryClient(), initialProps: { q: '' } },
    );
    await waitFor(() => expect(spy).toHaveBeenCalledTimes(1));

    rerender({ q: 's' });
    rerender({ q: 'so' });
    rerender({ q: 'son' });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(result.current.isSearching).toBe(true);

    await waitFor(() => expect(spy).toHaveBeenCalledTimes(2), {
      timeout: MODEL_SEARCH_DEBOUNCE_MS * 4,
    });
    expect(spy).toHaveBeenLastCalledWith(AiProviderId.ANTHROPIC, 'son');
    await act(async () => undefined);
  });
});
