import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { serveCmsPage } from '@/lib/msw/cms-test-utils';
import { withQueryClient } from '@/lib/test-utils';

import { usePatternStudioLandingContent } from '../hooks/usePatternStudioLandingContent';

describe('usePatternStudioLandingContent', () => {
  it('returns the built-in landing copy when the CMS has none', () => {
    const { result } = renderHook(() => usePatternStudioLandingContent(), { wrapper: withQueryClient() });

    expect(result.current.hero.title).toBe('Angaly Pattern Studio');
    expect(result.current.howItWorks.steps).toHaveLength(11);
    expect(result.current.pricing.tiers).toHaveLength(3);
  });

  it('applies CMS text, and parses lists (steps renumbered, tiers with one-feature-per-line and recommended flag)', async () => {
    serveCmsPage('pattern-studio', [
      { sectionKey: 'hero', titleText: 'Studio', ctaPrimaryLabel: 'Go', dataJson: { badge: 'BETA' } },
      { sectionKey: 'fonctionnement', dataJson: { steps: [{ label: 'Un', description: 'd1', category: 'validation' }, { label: 'Deux', description: 'd2', category: 'nope' }, { label: '' }] } },
      {
        sectionKey: 'offres',
        dataJson: { tiers: [{ name: 'Pro', price: '10 Ar', description: 'desc', features: 'A\n\n B ', recommended: 'oui' }, { name: 'sans prix' }] },
      },
    ]);

    const { result } = renderHook(() => usePatternStudioLandingContent(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.hero.title).toBe('Studio'));
    expect(result.current.hero.badge).toBe('BETA');
    expect(result.current.hero.ctaPrimary).toBe('Go');
    expect(result.current.hero.subheading).toBe('Votre patron, créé selon vos mesures.');
    expect(result.current.howItWorks.steps).toEqual([
      { number: 1, label: 'Un', description: 'd1', category: 'validation' },
      { number: 2, label: 'Deux', description: 'd2', category: 'conception' },
    ]);
    expect(result.current.pricing.tiers).toEqual([
      { id: 'Pro', name: 'Pro', price: '10 Ar', description: 'desc', features: ['A', 'B'], isRecommended: true, ctaText: 'Choisir cette offre' },
    ]);
  });
});
