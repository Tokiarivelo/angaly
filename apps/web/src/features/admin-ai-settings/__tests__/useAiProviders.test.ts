import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { withQueryClient } from '@/lib/test-utils';
import { useAiProviders } from '../hooks/useAiProviders';
import * as api from '../api/ai-providers.api';
import { AiProviderBillingTier, AiProviderId, AiProviderStatus } from '@angaly/types';

describe('useAiProviders', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches providers and catalog successfully', async () => {
    const mockResponse: api.AiProvidersListResponse = {
      catalog: [
        {
          id: AiProviderId.ANTHROPIC,
          name: 'Claude (Anthropic)',
          tier: AiProviderBillingTier.PAID,
          tierLabel: 'Payant',
          description: 'Modèles de pointe',
          monogram: 'AN',
          requiresApiKey: true,
          requiresBaseUrl: false,
          defaultModel: 'claude-sonnet-5-5',
          suggestedModels: ['claude-sonnet-5-5'],
        },
      ],
      configured: [
        {
          provider: AiProviderId.ANTHROPIC,
          model: 'claude-sonnet-5-5',
          baseUrl: null,
          apiKeyMasked: '••••3f9a',
          status: AiProviderStatus.OK,
          lastTestedAt: new Date().toISOString(),
          lastLatencyMs: 145,
          enabled: true,
          updatedAt: new Date().toISOString(),
        },
      ],
    };

    vi.spyOn(api, 'fetchAiProviders').mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useAiProviders(), {
      wrapper: withQueryClient(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.catalog).toHaveLength(1);
    expect(result.current.data?.configured).toHaveLength(1);
    expect(result.current.data?.configured[0]?.model).toBe('claude-sonnet-5-5');
  });
});
