import { renderHook, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { PatternPieceDto } from '@angaly/types';
import { draftReducer, HISTORY_LIMIT, INITIAL_DRAFT, usePatternDraft } from '../hooks/usePatternDraft';

const piece = (name: string): PatternPieceDto => ({
  id: name,
  versionId: 'v1',
  name,
  dimensionsJson: {},
  fabricRecommendation: null,
  quantity: 1,
  grainlineJson: null,
  seamAllowanceCm: 1,
  notchesJson: [],
});
const saved = [piece('a')];
const rename = (name: string) => (ps: PatternPieceDto[]) => ps.map((p) => ({ ...p, name }));

describe('draftReducer', () => {
  it('starts clean and shows no history', () => {
    expect(INITIAL_DRAFT).toEqual({ present: null, past: [], future: [] });
  });

  it('records one undo step per gesture, however many transient updates', () => {
    let s = draftReducer(INITIAL_DRAFT, { type: 'begin', base: saved });
    s = draftReducer(s, { type: 'update', base: saved, fn: rename('b') });
    s = draftReducer(s, { type: 'update', base: saved, fn: rename('c') });
    expect(s.past).toHaveLength(1);
    expect(s.present?.[0]?.name).toBe('c');
    s = draftReducer(s, { type: 'undo', base: saved });
    expect(s.present?.[0]?.name).toBe('a');
    expect(s.future).toHaveLength(1);
    s = draftReducer(s, { type: 'redo' });
    expect(s.present?.[0]?.name).toBe('c');
  });

  it('drops the redo stack on a new gesture and ignores no-op updates', () => {
    let s = draftReducer(INITIAL_DRAFT, { type: 'begin', base: saved });
    s = draftReducer(s, { type: 'update', base: saved, fn: rename('b') });
    s = draftReducer(s, { type: 'undo', base: saved });
    s = draftReducer(s, { type: 'begin', base: saved });
    expect(s.future).toEqual([]);
    const same = draftReducer(s, { type: 'update', base: saved, fn: (p) => p });
    expect(same).toBe(s);
  });

  it('is a no-op to undo/redo on empty stacks and caps the history', () => {
    expect(draftReducer(INITIAL_DRAFT, { type: 'undo', base: saved })).toBe(INITIAL_DRAFT);
    expect(draftReducer(INITIAL_DRAFT, { type: 'redo' })).toBe(INITIAL_DRAFT);
    let s = INITIAL_DRAFT;
    for (let i = 0; i < HISTORY_LIMIT + 20; i += 1) {
      s = draftReducer(s, { type: 'begin', base: saved });
      s = draftReducer(s, { type: 'update', base: saved, fn: rename(`n${i}`) });
    }
    expect(s.past).toHaveLength(HISTORY_LIMIT);
  });
});

describe('usePatternDraft', () => {
  it('exposes saved pieces until edited, then tracks dirty/undo/redo/reset', () => {
    const { result } = renderHook(() => usePatternDraft(saved));
    expect(result.current.pieces).toBe(saved);
    expect(result.current.dirty).toBe(false);

    act(() => result.current.commit(rename('b')));
    expect(result.current.pieces[0]?.name).toBe('b');
    expect(result.current.dirty).toBe(true);
    expect(result.current.canUndo).toBe(true);

    act(() => result.current.undo());
    expect(result.current.pieces[0]?.name).toBe('a');
    expect(result.current.dirty).toBe(false);
    expect(result.current.canRedo).toBe(true);

    act(() => result.current.redo());
    expect(result.current.pieces[0]?.name).toBe('b');

    act(() => {
      result.current.begin();
      result.current.update(rename('c'));
      result.current.update(rename('d'));
    });
    expect(result.current.pieces[0]?.name).toBe('d');
    act(() => result.current.undo());
    expect(result.current.pieces[0]?.name).toBe('b');

    act(() => result.current.reset());
    expect(result.current.pieces).toBe(saved);
    expect(result.current.dirty).toBe(false);
  });
});
