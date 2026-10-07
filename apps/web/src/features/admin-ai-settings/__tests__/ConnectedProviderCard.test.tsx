import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { withQueryClient } from '@/lib/test-utils';
import { ConnectedProviderCard } from '../ui/ConnectedProviderCard';
import {
  AiProviderBillingTier,
  AiProviderId,
  AiProviderStatus,
  type AiProviderCatalogEntry,
  type AiProviderConfigView,
} from '@angaly/types';
import * as api from '../api/ai-providers.api';

describe('ConnectedProviderCard', () => {
  const mockCatalogEntry: AiProviderCatalogEntry = {
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
  };

  const mockConfig: AiProviderConfigView = {
    provider: AiProviderId.ANTHROPIC,
    model: 'claude-sonnet-5-5',
    baseUrl: null,
    apiKeyMasked: '••••3f9a',
    status: AiProviderStatus.OK,
    lastTestedAt: '2026-10-02T10:00:00Z',
    lastLatencyMs: 250,
    enabled: true,
    updatedAt: '2026-10-02T10:00:00Z',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders provider info, model and status', () => {
    render(
      <ConnectedProviderCard
        config={mockConfig}
        catalogEntry={mockCatalogEntry}
        onEdit={vi.fn()}
      />,
      { wrapper: withQueryClient() },
    );

    expect(screen.getByText('Claude (Anthropic)')).toBeInTheDocument();
    expect(screen.getByText('claude-sonnet-5-5')).toBeInTheDocument();
    expect(screen.getByText('Connecté')).toBeInTheDocument();
    expect(screen.getByText('250 ms')).toBeInTheDocument();
    expect(screen.getByText('••••3f9a')).toBeInTheDocument();
  });

  it('calls onEdit when clicking Modifier', async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();

    render(
      <ConnectedProviderCard
        config={mockConfig}
        catalogEntry={mockCatalogEntry}
        onEdit={onEdit}
      />,
      { wrapper: withQueryClient() },
    );

    const editBtn = screen.getByRole('button', { name: /Modifier/i });
    await user.click(editBtn);

    expect(onEdit).toHaveBeenCalledWith(AiProviderId.ANTHROPIC);
  });

  it('triggers test mutation when clicking Tester', async () => {
    const testSpy = vi.spyOn(api, 'testAiProvider').mockResolvedValue({
      provider: AiProviderId.ANTHROPIC,
      status: AiProviderStatus.OK,
      latencyMs: 120,
      testedAt: new Date().toISOString(),
      message: 'Connexion réussie',
    });

    const user = userEvent.setup();

    render(
      <ConnectedProviderCard
        config={mockConfig}
        catalogEntry={mockCatalogEntry}
        onEdit={vi.fn()}
      />,
      { wrapper: withQueryClient() },
    );

    const testBtn = screen.getByRole('button', { name: /Tester/i });
    await user.click(testBtn);

    expect(testSpy).toHaveBeenCalledWith(AiProviderId.ANTHROPIC);
  });
});
