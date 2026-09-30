import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { serveCmsPage } from '@/lib/msw/cms-test-utils';
import { withQueryClient } from '@/lib/test-utils';

import { useContactChannels } from '../hooks/useContactChannels';

describe('useContactChannels', () => {
  it('returns the built-in channels when the CMS has none', () => {
    const { result } = renderHook(() => useContactChannels(), { wrapper: withQueryClient() });

    expect(result.current.phone.label).toBe('+261 20 22 123 45');
    expect(result.current.titles.hours).toBe('Nos horaires');
    expect(result.current.hours).toHaveLength(3);
  });

  it('overrides phone/email/socials/hours from the CMS, field by field', async () => {
    serveCmsPage('contact', [
      { sectionKey: 'coordonnees', dataJson: { phoneLabel: '+261 34 00 000 00', phoneHref: 'tel:+261340000000' } },
      { sectionKey: 'reseaux', dataJson: { links: [{ label: 'TikTok', href: 'https://tiktok.com/@angaly' }] } },
      { sectionKey: 'horaires', titleText: 'Horaires', dataJson: { rows: [{ label: 'Tous les jours', value: '08:00 - 20:00', closed: 'non' }, { label: 'Férié', value: 'Fermé', closed: 'oui' }] } },
    ]);

    const { result } = renderHook(() => useContactChannels(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.phone.label).toBe('+261 34 00 000 00'));
    expect(result.current.phone.href).toBe('tel:+261340000000');
    expect(result.current.email.label).toBe('contact@angaly.mg');
    expect(result.current.socials).toEqual([{ label: 'TikTok', href: 'https://tiktok.com/@angaly' }]);
    expect(result.current.titles.hours).toBe('Horaires');
    expect(result.current.hours).toEqual([
      { label: 'Tous les jours', value: '08:00 - 20:00', isClosed: false },
      { label: 'Férié', value: 'Fermé', isClosed: true },
    ]);
  });
});
