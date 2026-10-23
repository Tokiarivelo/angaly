'use client';

import { useCallback, useMemo, useReducer } from 'react';
import type { PatternPieceDto } from '@angaly/types';

type Pieces = PatternPieceDto[];

export interface DraftState {
  /** null = no local edit: the saved pieces are shown. */
  present: Pieces | null;
  past: Pieces[];
  future: Pieces[];
}

export type DraftAction =
  | { type: 'begin'; base: Pieces }
  | { type: 'update'; base: Pieces; fn: (pieces: Pieces) => Pieces }
  | { type: 'undo'; base: Pieces }
  | { type: 'redo' }
  | { type: 'cancel' }
  | { type: 'reset' };

export const HISTORY_LIMIT = 100;

export const INITIAL_DRAFT: DraftState = { present: null, past: [], future: [] };

/**
 * `begin` opens an undo step (one per gesture: a whole drag is ONE step), `update` changes the current
 * pieces without touching the history, so a drag can update at animation-frame rate cheaply.
 */
export const draftReducer = (state: DraftState, action: DraftAction): DraftState => {
  switch (action.type) {
    case 'begin': {
      const current = state.present ?? action.base;
      return { present: current, past: [...state.past, current].slice(-HISTORY_LIMIT), future: [] };
    }
    case 'update': {
      const current = state.present ?? action.base;
      const next = action.fn(current);
      return next === current ? state : { ...state, present: next };
    }
    case 'undo': {
      const previous = state.past[state.past.length - 1];
      if (!previous) return state;
      return {
        present: previous,
        past: state.past.slice(0, -1),
        future: [state.present ?? action.base, ...state.future].slice(0, HISTORY_LIMIT),
      };
    }
    case 'redo': {
      const [next, ...rest] = state.future;
      if (!next) return state;
      return {
        present: next,
        past: [...state.past, state.present ?? next].slice(-HISTORY_LIMIT),
        future: rest,
      };
    }
    case 'cancel': {
      // A gesture abandoned (Escape / right click in the 3D edit mode): back to before it, no redo entry.
      const previous = state.past[state.past.length - 1];
      if (!previous) return state;
      return { ...state, present: previous, past: state.past.slice(0, -1) };
    }
    case 'reset':
      return INITIAL_DRAFT;
  }
};

/** Local, undoable copy of the pattern pieces being edited in the studio. */
export const usePatternDraft = (saved: Pieces) => {
  const [state, dispatch] = useReducer(draftReducer, INITIAL_DRAFT);

  const pieces = state.present ?? saved;

  const begin = useCallback(() => dispatch({ type: 'begin', base: saved }), [saved]);
  const update = useCallback(
    (fn: (pieces: Pieces) => Pieces) => dispatch({ type: 'update', base: saved, fn }),
    [saved],
  );
  const commit = useCallback(
    (fn: (pieces: Pieces) => Pieces) => {
      dispatch({ type: 'begin', base: saved });
      dispatch({ type: 'update', base: saved, fn });
    },
    [saved],
  );
  const undo = useCallback(() => dispatch({ type: 'undo', base: saved }), [saved]);
  const redo = useCallback(() => dispatch({ type: 'redo' }), []);
  const cancel = useCallback(() => dispatch({ type: 'cancel' }), []);
  const reset = useCallback(() => dispatch({ type: 'reset' }), []);

  return useMemo(
    () => ({
      pieces,
      dirty: state.past.length > 0,
      canUndo: state.past.length > 0,
      canRedo: state.future.length > 0,
      begin,
      update,
      commit,
      undo,
      redo,
      cancel,
      reset,
    }),
    [pieces, state.past.length, state.future.length, begin, update, commit, undo, redo, cancel, reset],
  );
};
