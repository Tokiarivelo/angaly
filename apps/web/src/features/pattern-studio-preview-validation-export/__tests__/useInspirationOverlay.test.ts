import { describe, expect, it, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { PatternPieceDto } from '@angaly/types';
import reference from './fixtures/robe-pois-maxi.pieces.json';
import { DEFAULT_PHOTO_RECT, useInspirationOverlay, type InspirationOverlayInput } from '../hooks/useInspirationOverlay';
import { buildGarmentModelCached, MODEL_CACHE_SIZE } from '../utils/garment3d/model-cache';

const pieces = reference.pieces as PatternPieceDto[];
const input = (over: Partial<InspirationOverlayInput> = {}): InspirationOverlayInput => ({
  projectId: 'p1',
  url: 'https://cdn/x.jpg',
  pieces,
  garmentType: 'ROBE',
  measurements: reference.measurements,
  fabricColor: '#1a2b3c',
  enabled: true,
  ...over,
});

describe('buildGarmentModelCached — one drape shared by the 3D view and the photo', () => {
  it('hands back the same model for the same inputs, a new one when they change', () => {
    const a = buildGarmentModelCached(pieces, 'ROBE', reference.measurements, 'FEMME_STANDARD');
    expect(buildGarmentModelCached(pieces, 'ROBE', { ...reference.measurements }, 'FEMME_STANDARD')).toBe(a);
    const b = buildGarmentModelCached(pieces, 'ROBE', { ...reference.measurements, TOUR_TAILLE: 80 }, 'FEMME_STANDARD');
    expect(b).not.toBe(a);
    // Edited pieces (a new array) are draped again.
    expect(buildGarmentModelCached([...pieces], 'ROBE', reference.measurements, 'FEMME_STANDARD')).not.toBe(a);
  });

  it('forgets the oldest drapes beyond its size', () => {
    const first = buildGarmentModelCached(pieces, 'ROBE', { ...reference.measurements, TOUR_TAILLE: 60 }, 'FEMME_STANDARD');
    for (let k = 0; k < MODEL_CACHE_SIZE; k += 1) buildGarmentModelCached(pieces, 'ROBE', { ...reference.measurements, TOUR_TAILLE: 61 + k }, 'FEMME_STANDARD');
    expect(buildGarmentModelCached(pieces, 'ROBE', { ...reference.measurements, TOUR_TAILLE: 60 }, 'FEMME_STANDARD')).not.toBe(first);
  });
});

describe('useInspirationOverlay', () => {
  beforeEach(() => window.localStorage.clear());

  it('drapes nothing while the photo is hidden', () => {
    const { result } = renderHook(() => useInspirationOverlay(input({ enabled: false })));
    expect(result.current.projection).toBeNull();
  });

  it('projects the pattern, and keeps a box set by hand for this project and photo', () => {
    const { result, rerender } = renderHook((props: InspirationOverlayInput) => useInspirationOverlay(props), { initialProps: input() });
    expect(result.current.projection?.pieces.size).toBeGreaterThan(2);
    // The photo is not read in jsdom: the default box.
    expect(result.current.rect).toEqual(DEFAULT_PHOTO_RECT);
    expect(result.current.calibrated).toBe(false);
    const box = { x0: 0.2, y0: 0.1, x1: 0.8, y1: 0.95 };
    act(() => result.current.setRect(box));
    expect(result.current.rect).toEqual(box);
    expect(result.current.calibrated).toBe(true);
    // Back on the same project later: the box is still there; another photo has its own.
    const again = renderHook(() => useInspirationOverlay(input()));
    expect(again.result.current.rect).toEqual(box);
    rerender(input({ url: 'https://cdn/y.jpg' }));
    expect(result.current.calibrated).toBe(false);
    act(() => again.result.current.resetRect());
    expect(again.result.current.calibrated).toBe(false);
  });
});
