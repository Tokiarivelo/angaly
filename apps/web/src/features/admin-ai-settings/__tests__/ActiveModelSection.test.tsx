import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AiProviderId, type AiProviderCatalogEntry, type AiProviderConfigView, type AiRoutingSetting } from '@angaly/types';
import { ActiveModelSection } from '../ui/ActiveModelSection';

const mutate = vi.fn();
vi.mock('../hooks/useUpdateAiRouting', () => ({
  useUpdateAiRouting: () => ({ mutate, isPending: false }),
}));

const entry = (id: AiProviderId, name: string) => ({ id, name, tierLabel: 'Premium' }) as AiProviderCatalogEntry;
const catalog = [
  entry(AiProviderId.LOCAL_STATISTICAL, 'Local'),
  entry(AiProviderId.GEMINI, 'Gemini'),
  entry(AiProviderId.OPENAI, 'OpenAI'),
  entry(AiProviderId.ANTHROPIC, 'Claude'),
];
const providers = [AiProviderId.GEMINI, AiProviderId.OPENAI, AiProviderId.ANTHROPIC].map(
  (provider) => ({ provider, enabled: true }) as AiProviderConfigView,
);
const routing = (fallbacks: AiProviderId[]): AiRoutingSetting => ({
  measurementProvider: AiProviderId.LOCAL_STATISTICAL,
  patternSuggestionProvider: AiProviderId.GEMINI,
  patternSuggestionFallbacks: fallbacks,
  updatedAt: '2026-10-08T00:00:00Z',
  updatedById: null,
});

describe('ActiveModelSection — photo fallbacks', () => {
  beforeEach(() => mutate.mockClear());

  it('offers only external providers and saves a toggled fallback', async () => {
    render(<ActiveModelSection routing={routing([])} catalog={catalog} providers={providers} />);

    expect(screen.queryByRole('checkbox', { name: /Local/ })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('checkbox', { name: /OpenAI/ }));

    expect(mutate).toHaveBeenCalledWith({ patternSuggestionFallbacks: [AiProviderId.OPENAI] });
  });

  it('shows the order and lets the admin move an entry up', async () => {
    render(
      <ActiveModelSection
        routing={routing([AiProviderId.OPENAI, AiProviderId.ANTHROPIC])}
        catalog={catalog}
        providers={providers}
      />,
    );

    expect(screen.getByText(/Ordre : OpenAI → Claude/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Monter Claude' }));

    expect(mutate).toHaveBeenCalledWith({
      patternSuggestionFallbacks: [AiProviderId.ANTHROPIC, AiProviderId.OPENAI],
    });
    expect(screen.getByRole('button', { name: 'Monter OpenAI' })).toBeDisabled();
  });

  it('blocks a 4th fallback and explains when no provider is connected', () => {
    const { rerender } = render(
      <ActiveModelSection
        routing={routing([AiProviderId.GEMINI, AiProviderId.OPENAI, AiProviderId.ANTHROPIC])}
        catalog={[...catalog, entry(AiProviderId.GROQ, 'Groq')]}
        providers={[...providers, { provider: AiProviderId.GROQ, enabled: true } as AiProviderConfigView]}
      />,
    );
    expect(screen.getByRole('checkbox', { name: /Groq/ })).toBeDisabled();

    rerender(<ActiveModelSection routing={routing([])} catalog={catalog} providers={[]} />);
    expect(screen.getByText(/Connectez d.abord un fournisseur externe/)).toBeInTheDocument();
  });
});
