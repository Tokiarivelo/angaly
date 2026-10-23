import { renderHook, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { PatternPieceDto } from '@angaly/types';
import { usePatternDraft } from '../hooks/usePatternDraft';
import { DEFAULT_SCULPT, SCULPT_RADIUS_BOUNDS, usePatternSculpt } from '../hooks/usePatternSculpt';
import type { SculptAnchor } from '../utils/garment3d/sculpt';
import { pieceOutline, withOutline } from '../utils/pattern-editing';

const base: PatternPieceDto = withOutline(
  {
    id: 'front',
    versionId: 'v1',
    name: 'Devant',
    dimensionsJson: {},
    fabricRecommendation: null,
    quantity: 1,
    grainlineJson: null,
    seamAllowanceCm: 1,
    notchesJson: [],
  },
  [
    { x: 0, y: 0 },
    { x: 200, y: 0 },
    { x: 200, y: 400 },
    { x: 0, y: 400 },
  ],
);
const saved = [base, { ...base, id: 'back', name: 'Dos' }];

/** World x (m) → flat x (mm), world y (m) → flat −y (mm): the cloth faces the camera, y up. */
const anchor = (pieceId: string, flat = { x: 200, y: 400 }, weight = 1): SculptAnchor => ({
  pieceId,
  flat,
  inverse: [1000, 0, 0, 0, -1000, 0],
  normal: [0, 0, 1],
  weight,
});

const setup = () =>
  renderHook(() => {
    const draft = usePatternDraft(saved);
    return { draft, sculpt: usePatternSculpt(draft) };
  });

describe('usePatternSculpt', () => {
  it('is disabled without a draft and clamps the brush radius', () => {
    const { result } = renderHook(() => usePatternSculpt(null));
    expect(result.current.enabled).toBe(false);
    act(() => result.current.setActive(true));
    expect(result.current.active).toBe(false);
    expect(result.current.settings).toEqual(DEFAULT_SCULPT);
    act(() => result.current.setRadius(10_000));
    expect(result.current.settings.radiusMm).toBe(SCULPT_RADIUS_BOUNDS.max);
    act(() => result.current.setRadius(1));
    expect(result.current.settings.radiusMm).toBe(SCULPT_RADIUS_BOUNDS.min);
    expect(result.current.start([anchor('front')])).toBe(false);
  });

  it('turns a drag into ONE undo step on every piece it reaches, the 2D draft following', () => {
    const { result } = setup();
    act(() => {
      result.current.sculpt.setTool('length');
      result.current.sculpt.setRadius(100);
    });
    expect(result.current.sculpt.settings.tool).toBe('length');
    let started = false;
    act(() => {
      started = result.current.sculpt.start([anchor('front'), anchor('back', { x: 200, y: 400 }, 0.5)]);
    });
    expect(started).toBe(true);
    // A click without a move leaves no step.
    expect(result.current.draft.canUndo).toBe(false);
    act(() => result.current.sculpt.move([0, -0.02, 0]));
    act(() => result.current.sculpt.move([0, -0.05, 0]));
    act(() => result.current.sculpt.end());
    const [front, back] = result.current.draft.pieces;
    expect(Math.max(...pieceOutline(front!).map((p) => p.y))).toBeCloseTo(450);
    expect(Math.max(...pieceOutline(back!).map((p) => p.y))).toBeCloseTo(425);
    expect((front!.dimensionsJson as { heightMm: number }).heightMm).toBeCloseTo(450);
    act(() => result.current.draft.undo());
    expect(result.current.draft.pieces).toEqual(saved);
    expect(result.current.draft.canUndo).toBe(false);
  });

  it('keeps the last valid shape when a drag would cross the outline', () => {
    const { result } = setup();
    act(() => {
      result.current.sculpt.setFalloff('constant');
      result.current.sculpt.setRadius(60);
    });
    act(() => {
      result.current.sculpt.start([anchor('front', { x: 200, y: 200 })]);
    });
    act(() => result.current.sculpt.move([0.03, 0, 0]));
    expect(result.current.sculpt.blocked).toBe(false);
    act(() => result.current.sculpt.move([-0.4, 0, 0]));
    expect(result.current.sculpt.blocked).toBe(true);
    expect(Math.max(...pieceOutline(result.current.draft.pieces[0]!).map((p) => p.x))).toBeCloseTo(230);
    // Moves after the end of the gesture do nothing.
    act(() => result.current.sculpt.end());
    act(() => result.current.sculpt.move([0.1, 0, 0]));
    expect(Math.max(...pieceOutline(result.current.draft.pieces[0]!).map((p) => p.x))).toBeCloseTo(230);
  });

  it('refuses anchors on pieces that are not in the draft', () => {
    const { result } = setup();
    let started = true;
    act(() => {
      started = result.current.sculpt.start([anchor('ghost')]);
    });
    expect(started).toBe(false);
  });
});
