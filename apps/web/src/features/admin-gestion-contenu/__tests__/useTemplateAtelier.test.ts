import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useTemplateAtelier } from '../hooks/useTemplateAtelier';
import type { CatalogPageEntry } from '../utils/merge-section-catalog';

const MOCK_PAGES: CatalogPageEntry[] = [
  { page: 'accueil', label: 'Accueil', sections: [] },
  { page: 'a-propos', label: 'À propos', sections: [] },
];

describe('useTemplateAtelier', () => {
  it('initializes with default preset and target page', () => {
    const onAddSection = vi.fn();
    const { result } = renderHook(() =>
      useTemplateAtelier({
        pages: MOCK_PAGES,
        initialPage: 'accueil',
        onAddSection,
      }),
    );

    expect(result.current.selectedPreset.kind).toBe('hero-cinematic');
    expect(result.current.targetPage).toBe('accueil');
    expect(result.current.customValues.titleText).toBe('ÉCLIPSE SOLAIRE');
  });

  it('updates custom values and auto-generates slug when label changes', () => {
    const onAddSection = vi.fn();
    const { result } = renderHook(() =>
      useTemplateAtelier({
        pages: MOCK_PAGES,
        initialPage: 'accueil',
        onAddSection,
      }),
    );

    act(() => {
      result.current.handleLabelChange('Nouvelle Collection Soie');
    });

    expect(result.current.label).toBe('Nouvelle Collection Soie');
    expect(result.current.sectionKey).toBe('nouvelle-collection-soie');
  });

  it('calls onAddSection with complete payload when handleAdd is executed', () => {
    const onAddSection = vi.fn();
    const { result } = renderHook(() =>
      useTemplateAtelier({
        pages: MOCK_PAGES,
        initialPage: 'accueil',
        onAddSection,
      }),
    );

    act(() => {
      result.current.handleAdd();
    });

    expect(onAddSection).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 'accueil',
        kind: 'hero-cinematic',
        titleText: 'ÉCLIPSE SOLAIRE',
      }),
    );
  });
});
