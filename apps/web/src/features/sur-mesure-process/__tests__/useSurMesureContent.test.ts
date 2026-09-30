import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { HttpResponse, http } from 'msw';

import { server } from '@/lib/msw/server';
import { withQueryClient } from '@/lib/test-utils';

import { useSurMesureContent } from '../hooks/useSurMesureContent';

describe('useSurMesureContent', () => {
  it('returns the default content, settled with no error, when the CMS has no rows', async () => {
    const { result } = renderHook(() => useSurMesureContent(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBeNull();
    expect(result.current.data.hero.title).toBe('Sur Mesure');
    expect(result.current.data.whyChoose.items).toHaveLength(3);
    expect(result.current.data.faq.items).toHaveLength(5);
  });

  it('keeps exactly 4 gallery pieces, matching the real Stitch screen', () => {
    const { result } = renderHook(() => useSurMesureContent(), { wrapper: withQueryClient() });

    expect(result.current.data.gallery.items).toHaveLength(4);
  });

  it('carries a role (not a piece reference) for the testimonial author', () => {
    const { result } = renderHook(() => useSurMesureContent(), { wrapper: withQueryClient() });

    expect(result.current.data.testimonial.name).toBe('Éléonore de V.');
    expect(result.current.data.testimonial.role).toBe('Cliente Sur Mesure, Paris');
  });

  it('overrides defaults field by field from the CMS: text, images, and the lists', async () => {
    server.use(
      http.get('http://localhost:3003/api/content/public/sur-mesure', () =>
        HttpResponse.json({
          success: true,
          data: [
            { page: 'sur-mesure', sectionKey: 'hero', locale: 'FR', titleText: 'Couture privée', subtitleText: null, bodyText: null, ctaPrimaryLabel: null, ctaSecondaryLabel: null, dataJson: null, mediaId: 'm', media: { id: 'm', url: 'https://cdn.example/hero.jpg', altText: null }, updatedAt: '' },
            { page: 'sur-mesure', sectionKey: 'etapes', locale: 'FR', titleText: null, subtitleText: null, bodyText: null, ctaPrimaryLabel: null, ctaSecondaryLabel: null, dataJson: { steps: [{ title: 'A' }, { title: 'B' }, {}] }, mediaId: null, updatedAt: '' },
            { page: 'sur-mesure', sectionKey: 'faq', locale: 'FR', titleText: null, subtitleText: null, bodyText: null, ctaPrimaryLabel: null, ctaSecondaryLabel: null, dataJson: { items: [{ question: 'Q ?', answer: 'R.' }, { question: '', answer: 'x' }] }, mediaId: null, updatedAt: '' },
          ],
        }),
      ),
    );

    const { result } = renderHook(() => useSurMesureContent(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.data.hero.title).toBe('Couture privée'));
    expect(result.current.data.hero.subtitle).toBe('Votre idée, façonnée avec précision, entièrement pour vous.');
    expect(result.current.data.hero.imageUrl).toBe('https://cdn.example/hero.jpg');
    expect(result.current.data.process.steps).toEqual([{ number: 1, title: 'A' }, { number: 2, title: 'B' }]);
    expect(result.current.data.faq.items).toEqual([{ question: 'Q ?', answer: 'R.' }]);
    expect(result.current.data.gallery.items).toHaveLength(4);
  });
});
