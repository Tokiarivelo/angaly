import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { withQueryClient } from '@/lib/test-utils';
import { ConnectProviderDrawer } from '../ui/ConnectProviderDrawer';
import {
  AiProviderBillingTier,
  AiProviderId,
  AiProviderStatus,
  type AiProviderCatalogEntry,
  type AiProviderConfigView,
} from '@angaly/types';
import * as api from '../api/ai-providers.api';

describe('ConnectProviderDrawer', () => {
  const mockCatalog: AiProviderCatalogEntry[] = [
    {
      id: AiProviderId.ANTHROPIC,
      name: 'Claude (Anthropic)',
      tier: AiProviderBillingTier.PAID,
      tierLabel: 'Payant',
      description: 'Modèles de pointe pour la déduction morphologique',
      monogram: 'AN',
      requiresApiKey: true,
      requiresBaseUrl: false,
      defaultModel: 'claude-sonnet-5-5',
      suggestedModels: ['claude-sonnet-5-5', 'claude-haiku-4-5-20251001'],
    },
  ];

  const mockProviders: AiProviderConfigView[] = [
    {
      provider: AiProviderId.ANTHROPIC,
      model: 'claude-sonnet-5-5',
      baseUrl: null,
      apiKeyMasked: '••••3f9a',
      status: AiProviderStatus.OK,
      lastTestedAt: '2026-10-02T10:00:00Z',
      lastLatencyMs: 180,
      enabled: true,
      updatedAt: '2026-10-02T10:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, 'fetchAiProviderModels').mockResolvedValue({
      provider: AiProviderId.ANTHROPIC,
      models: [],
      source: 'remote',
    });
  });

  it('renders drawer with model and suggestion chips when open', () => {
    render(
      <ConnectProviderDrawer
        isOpen={true}
        onClose={vi.fn()}
        providerId={AiProviderId.ANTHROPIC}
        catalog={mockCatalog}
        providers={mockProviders}
      />,
      { wrapper: withQueryClient() },
    );

    expect(screen.getByRole('heading', { name: /Connecter Claude \(Anthropic\)/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('claude-sonnet-5-5')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'claude-haiku-4-5-20251001' })).toBeInTheDocument();
  });

  it('updates model when clicking suggestion chip', async () => {
    const user = userEvent.setup();

    render(
      <ConnectProviderDrawer
        isOpen={true}
        onClose={vi.fn()}
        providerId={AiProviderId.ANTHROPIC}
        catalog={mockCatalog}
        providers={mockProviders}
      />,
      { wrapper: withQueryClient() },
    );

    const chip = screen.getByRole('button', { name: 'claude-haiku-4-5-20251001' });
    await user.click(chip);

    expect(screen.getByDisplayValue('claude-haiku-4-5-20251001')).toBeInTheDocument();
  });

  it('calls upsert mutation upon form submission', async () => {
    const upsertSpy = vi.spyOn(api, 'upsertAiProvider').mockResolvedValue(mockProviders[0]!);
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <ConnectProviderDrawer
        isOpen={true}
        onClose={onClose}
        providerId={AiProviderId.ANTHROPIC}
        catalog={mockCatalog}
        providers={mockProviders}
      />,
      { wrapper: withQueryClient() },
    );

    const submitBtn = screen.getByRole('button', { name: /Enregistrer le fournisseur/i });
    await user.click(submitBtn);

    expect(upsertSpy).toHaveBeenCalledWith(
      AiProviderId.ANTHROPIC,
      expect.objectContaining({ model: 'claude-sonnet-5-5' }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('lists provider models once the connection is verified and picks one', async () => {
    const modelsSpy = vi.spyOn(api, 'fetchAiProviderModels').mockResolvedValue({
      provider: AiProviderId.ANTHROPIC,
      models: [{ id: 'claude-opus-5-5' }, { id: 'claude-sonnet-5-5' }],
      source: 'remote',
    });
    const user = userEvent.setup();

    render(
      <ConnectProviderDrawer
        isOpen={true}
        onClose={vi.fn()}
        providerId={AiProviderId.ANTHROPIC}
        catalog={mockCatalog}
        providers={mockProviders}
      />,
      { wrapper: withQueryClient() },
    );

    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByRole('option', { name: 'claude-opus-5-5' }));

    expect(modelsSpy).toHaveBeenCalled();
    expect(screen.getByRole('combobox')).toHaveValue('claude-opus-5-5');
  });

  it('does not list models before the connection is verified', () => {
    const modelsSpy = vi.spyOn(api, 'fetchAiProviderModels');
    const untested = [{ ...mockProviders[0]!, status: AiProviderStatus.UNTESTED }];

    render(
      <ConnectProviderDrawer
        isOpen={true}
        onClose={vi.fn()}
        providerId={AiProviderId.ANTHROPIC}
        catalog={mockCatalog}
        providers={untested}
      />,
      { wrapper: withQueryClient() },
    );

    expect(modelsSpy).not.toHaveBeenCalled();
  });
});
