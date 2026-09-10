import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useSurMesureContent } from '../hooks/useSurMesureContent';

describe('useSurMesureContent', () => {
  it('returns the static content with no loading/error state', () => {
    const { result } = renderHook(() => useSurMesureContent());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.data.hero.title).toBe('Sur Mesure');
    expect(result.current.data.whyChoose.items).toHaveLength(3);
    expect(result.current.data.faq.items).toHaveLength(5);
  });

  it('keeps exactly 4 gallery pieces, matching the real Stitch screen', () => {
    const { result } = renderHook(() => useSurMesureContent());

    expect(result.current.data.gallery.items).toHaveLength(4);
  });

  it('carries a role (not a piece reference) for the testimonial author', () => {
    const { result } = renderHook(() => useSurMesureContent());

    expect(result.current.data.testimonial.name).toBe('Éléonore de V.');
    expect(result.current.data.testimonial.role).toBe('Cliente Sur Mesure, Paris');
  });
});
