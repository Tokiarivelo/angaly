import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { withQueryClient } from '@/lib/test-utils';
import { AiSettingsPage } from '../ui/AiSettingsPage';
import {
  AiProviderBillingTier,
  AiProviderId,
  AiProviderStatus,
  type AiProviderCatalogEntry,
  type AiProviderConfigView,
  type AiRoutingSetting,
} from '@angaly/types';
import * as api from '../api/ai-providers.api';

describe('AiSettingsPage', () => {
  const mockCatalog: AiProviderCatalogEntry[] = [
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
    {
      id: AiProviderId.GEMINI,
      name: 'Google Gemini',
      tier: AiProviderBillingTier.FREEMIUM,
      tierLabel: 'Gratuit avec quota',
      description: 'Modèle rapide multimodal',
      monogram: 'GO',
      requiresApiKey: true,
      requiresBaseUrl: false,
      defaultModel: 'gemini-2.5-flash',
      suggestedModels: ['gemini-2.5-flash'],
    },
    {
      id: AiProviderId.LOCAL_STATISTICAL,
      name: 'Modèle statistique local (ANSUR II)',
      tier: AiProviderBillingTier.SELF_HOSTED,
      tierLabel: 'Auto-hébergé · Intégré',
      description: 'Base biométrique intégrée',
      monogram: 'LC',
      requiresApiKey: false,
      requiresBaseUrl: false,
      defaultModel: 'ansur2-ridge-v1',
      suggestedModels: ['ansur2-ridge-v1'],
      isSelfHosted: true,
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
      lastLatencyMs: 250,
      enabled: true,
      updatedAt: '2026-10-02T10:00:00Z',
    },
  ];

  const mockRouting: AiRoutingSetting = {
    measurementProvider: AiProviderId.ANTHROPIC,
    patternSuggestionProvider: AiProviderId.ANTHROPIC,
    patternSuggestionFallbacks: [],
    updatedAt: '2026-10-02T10:00:00Z',
    updatedById: 'admin-1',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, 'fetchAiProviders').mockResolvedValue({
      catalog: mockCatalog,
      configured: mockProviders,
    });
    vi.spyOn(api, 'fetchAiRouting').mockResolvedValue(mockRouting);
  });

  it('renders page header, active model section and connected providers', async () => {
    render(<AiSettingsPage />, { wrapper: withQueryClient() });

    expect(await screen.findByRole('heading', { name: /Paramètres IA Pattern Studio/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Modèle actif par usage/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Fournisseurs connectés/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Catalogue de fournisseurs/i })).toBeInTheDocument();
    expect(screen.getByText(/Garantie Moteur ANGALY/i)).toBeInTheDocument();
  });

  it('opens drawer when clicking "Ajouter un fournisseur"', async () => {
    const user = userEvent.setup();
    render(<AiSettingsPage />, { wrapper: withQueryClient() });

    const addBtn = await screen.findByRole('button', { name: /Ajouter un fournisseur/i });
    await user.click(addBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Connecter/i })).toBeInTheDocument();
  });
});
