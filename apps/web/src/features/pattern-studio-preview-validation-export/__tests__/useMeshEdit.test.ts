import { renderHook, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { PatternPieceDto } from '@angaly/types';
import { usePatternDraft } from '../hooks/usePatternDraft';
import { PROPORTIONAL_RADIUS_BOUNDS, useMeshEdit } from '../hooks/useMeshEdit';
import { pointKey, type PointInstance } from '../utils/garment3d/mesh-edit';
import type { SculptAnchor } from '../utils/garment3d/sculpt';
import { pieceOutline, withOutline } from '../utils/pattern-editing';

const square = (id: string): PatternPieceDto =>
  withOutline(
    { id, versionId: 'v', name: id, dimensionsJson: {}, fabricRecommendation: null, quantity: 1, grainlineJson: null, seamAllowanceCm: 1, notchesJson: [] },
    [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 200 },
      { x: 0, y: 200 },
    ],
  );
const saved = [square('a'), square('b')];
const anchor = (pieceId: string, mirrored = false): SculptAnchor => ({
  pieceId,
  flat: { x: 0, y: 0 },
  inverse: [mirrored ? -1000 : 1000, 0, 0, 0, -1000, 0],
  normal: [0, 0, 1],
  weight: 1,
  along: [
    [mirrored ? -0.001 : 0.001, 0, 0],
    [0, -0.001, 0],
  ],
});
/** Piece a seen twice (both halves of a fold), piece b once. */
const instances: PointInstance[] = [
  ...[0, 1, 2, 3].flatMap((index) => [
    { key: pointKey('a', index), pieceId: 'a', index, panelId: 'left', position: [0.1, 1, 0.1] as [number, number, number], normal: [0, 0, 1] as [number, number, number], anchor: anchor('a') },
    { key: pointKey('a', index), pieceId: 'a', index, panelId: 'right', position: [-0.1, 1, 0.1] as [number, number, number], normal: [0, 0, 1] as [number, number, number], anchor: anchor('a', true) },
  ]),
  ...[0, 1, 2, 3].map((index) => ({ key: pointKey('b', index), pieceId: 'b', index, panelId: 'b', position: [0, 0.5, 0.1] as [number, number, number], normal: [0, 0, 1] as [number, number, number], anchor: anchor('b') })),
];

const setup = () =>
  renderHook(() => {
    const draft = usePatternDraft(saved);
    return { draft, edit: useMeshEdit(draft) };
  });
const outline = (r: ReturnType<typeof setup>['result'], id = 'a') => pieceOutline(r.current.draft.pieces.find((p) => p.id === id)!);

describe('useMeshEdit — selection', () => {
  it('selects, extends, toggles off with shift, and clears on an empty click', () => {
    const { result } = setup();
    act(() => result.current.edit.select('a#1', 'left', false));
    act(() => result.current.edit.select('a#2', 'left', true));
    expect([...result.current.edit.selection.keys()]).toEqual(['a#1', 'a#2']);
    act(() => result.current.edit.select('a#1', 'left', true));
    expect([...result.current.edit.selection.keys()]).toEqual(['a#2']);
    act(() => result.current.edit.select('b#0', 'b', false));
    expect([...result.current.edit.selection.keys()]).toEqual(['b#0']);
    act(() => result.current.edit.select(null, null, true));
    expect(result.current.edit.selection.size).toBe(1);
    act(() => result.current.edit.select(null, null, false));
    expect(result.current.edit.selection.size).toBe(0);
  });

  it('box-selects, selects all / none (A), the whole piece (Ctrl+L) and deselects (Alt+A)', () => {
    const { result } = setup();
    act(() => result.current.edit.selectMany([{ key: 'a#0', panelId: 'left' }, { key: 'a#1', panelId: 'left' }], false));
    expect(result.current.edit.selection.size).toBe(2);
    act(() => result.current.edit.selectLinked(instances));
    expect(result.current.edit.selection.size).toBe(4);
    act(() => result.current.edit.toggleAll(instances));
    expect(result.current.edit.selection.size).toBe(8);
    act(() => result.current.edit.toggleAll(instances));
    expect(result.current.edit.selection.size).toBe(0);
    act(() => result.current.edit.selectPiece('b', instances, false));
    expect([...result.current.edit.selection.keys()]).toEqual(['b#0', 'b#1', 'b#2', 'b#3']);
    act(() => result.current.edit.deselectAll());
    expect(result.current.edit.selection.size).toBe(0);
  });
});

describe('useMeshEdit — transforms', () => {
  it('needs a selection to start, then grabs through the half it was picked on (one undo step)', () => {
    const { result } = setup();
    let started = true;
    act(() => {
      started = result.current.edit.startTransform('grab', instances);
    });
    expect(started).toBe(false);
    // Picked on the mirrored half: moving right in the world moves the point left on the pattern.
    act(() => result.current.edit.select('a#2', 'right', false));
    act(() => {
      started = result.current.edit.startTransform('grab', instances);
    });
    expect(started).toBe(true);
    expect(result.current.edit.modal).toEqual({ kind: 'grab', axis: null, typed: '' });
    act(() => result.current.edit.apply({ world: [0.01, 0.02, 0], toCamera: [0, 0, 1] }));
    expect(outline(result)[2]).toEqual({ x: 90, y: 180 });
    // X: only along the world x axis.
    act(() => result.current.edit.setAxis('x'));
    expect(outline(result)[2]).toEqual({ x: 90, y: 200 });
    act(() => result.current.edit.confirm());
    expect(result.current.edit.modal).toBeNull();
    expect(result.current.draft.canUndo).toBe(true);
    act(() => result.current.draft.undo());
    expect(outline(result)[2]).toEqual({ x: 100, y: 200 });
    expect(result.current.draft.canUndo).toBe(false);
  });

  it('takes a typed value (cm along the axis), with sign and backspace', () => {
    const { result } = setup();
    act(() => result.current.edit.select('a#2', 'left', false));
    act(() => {
      result.current.edit.startTransform('grab', instances);
    });
    act(() => result.current.edit.setAxis('y'));
    for (const k of ['2', '5', 'Backspace', '.', '5', '-']) act(() => result.current.edit.typeKey(k));
    expect(result.current.edit.modal?.typed).toBe('-2.5');
    // −2.5 cm along world y (down) = +25 mm on the pattern (y down).
    expect(outline(result)[2]).toEqual({ x: 100, y: 225 });
    act(() => result.current.edit.typeKey('a'));
    expect(result.current.edit.modal?.typed).toBe('-2.5');
  });

  it('scales, rotates and cancels back to the state before (Escape), leaving no undo step', () => {
    const { result } = setup();
    act(() => result.current.edit.selectMany([{ key: 'a#1', panelId: 'left' }, { key: 'a#2', panelId: 'left' }], false));
    act(() => {
      result.current.edit.startTransform('scale', instances);
    });
    act(() => result.current.edit.apply({ factor: 1.5, toCamera: [0, 0, 1] }));
    expect(outline(result)[1]).toEqual({ x: 100, y: -50 });
    act(() => result.current.edit.cancel());
    expect(outline(result)[1]).toEqual({ x: 100, y: 0 });
    expect(result.current.draft.canUndo).toBe(false);
    act(() => {
      result.current.edit.startTransform('rotate', instances);
    });
    act(() => result.current.edit.typeKey('9'));
    act(() => result.current.edit.typeKey('0'));
    // 90° typed: the right edge turns about its middle (100, 100).
    const [p1, p2] = outline(result).slice(1, 3);
    expect(p1!.x).toBeCloseTo(0);
    expect(p2!.x).toBeCloseTo(200);
    act(() => result.current.edit.confirm());
  });

  it('proportional editing drags the neighbours, its radius following the wheel during the transform', () => {
    const { result } = setup();
    act(() => result.current.edit.toggleProportional());
    act(() => result.current.edit.setProportionalFalloff('linear'));
    act(() => result.current.edit.setProportionalRadius(150));
    act(() => result.current.edit.select('a#2', 'left', false));
    act(() => {
      result.current.edit.startTransform('grab', instances);
    });
    act(() => result.current.edit.apply({ world: [0.03, 0, 0], toCamera: [0, 0, 1] }));
    expect(outline(result)[3]!.x).toBeCloseTo(10);
    act(() => result.current.edit.setProportionalRadius(300));
    expect(outline(result)[3]!.x).toBeCloseTo(20);
    act(() => result.current.edit.setProportionalRadius(1e9));
    expect(result.current.edit.proportional.radiusMm).toBe(PROPORTIONAL_RADIUS_BOUNDS.max);
    act(() => result.current.edit.toggleProportional());
    expect(outline(result)[3]!.x).toBe(0);
  });
});

describe('useMeshEdit — topology and coordinates', () => {
  it('deletes, subdivides and inserts, each one undo step', () => {
    const { result } = setup();
    act(() => result.current.edit.selectMany([{ key: 'a#1', panelId: 'left' }, { key: 'a#2', panelId: 'left' }], false));
    act(() => result.current.edit.subdivideSelected());
    expect(outline(result)).toHaveLength(5);
    expect(result.current.edit.selection.has('a#2')).toBe(true);
    act(() => result.current.edit.select('a#2', 'left', false));
    act(() => result.current.edit.deleteSelected());
    expect(outline(result)).toHaveLength(4);
    expect(result.current.edit.selection.size).toBe(0);
    let ok = false;
    act(() => {
      ok = result.current.edit.insertAt('b', { x: 50, y: 2 }, 'b');
    });
    expect(ok).toBe(true);
    expect(outline(result, 'b')).toHaveLength(5);
    expect([...result.current.edit.selection.keys()]).toEqual(['b#1']);
    act(() => {
      ok = result.current.edit.insertAt('b', { x: 50, y: 100 }, 'b');
    });
    expect(ok).toBe(false);
  });

  it('moves the selection’s median to typed pattern coordinates', () => {
    const { result } = setup();
    act(() => result.current.edit.selectMany([{ key: 'a#1', panelId: 'left' }, { key: 'a#2', panelId: 'left' }], false));
    act(() => result.current.edit.moveMedianTo(instances, { x: 120 }));
    expect(outline(result).slice(1, 3)).toEqual([
      { x: 120, y: 0 },
      { x: 120, y: 200 },
    ]);
    act(() => result.current.edit.moveMedianTo(instances, { y: 110 }));
    expect(outline(result)[1]).toEqual({ x: 120, y: 10 });
  });

  it('does nothing without a draft', () => {
    const { result } = renderHook(() => useMeshEdit(null));
    expect(result.current.enabled).toBe(false);
    expect(result.current.startTransform('grab', instances)).toBe(false);
  });
});
