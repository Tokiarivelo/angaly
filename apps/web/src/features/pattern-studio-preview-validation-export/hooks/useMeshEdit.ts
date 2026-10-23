'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import type { PatternPieceDto } from '@angaly/types';
import type { usePatternDraft } from './usePatternDraft';
import {
  constrain,
  deletePoints,
  grabPoints,
  insertPointAt,
  offsetPoints,
  resolveSelection,
  rotatePoints,
  scalePoints,
  selectionMedian,
  subdividePoints,
  type Axis,
  type PointInstance,
  type Proportional,
  type SelectedPoint,
} from '../utils/garment3d/mesh-edit';
import type { Falloff, Vec3 } from '../utils/garment3d/sculpt';

type PatternDraft = ReturnType<typeof usePatternDraft>;

/** Blender's modal transforms: G grab, S scale, R rotate. */
export type TransformKind = 'grab' | 'scale' | 'rotate';

export interface ModalState {
  kind: TransformKind;
  axis: Axis | null;
  /** Value typed during the transform (cm for grab, factor for scale, degrees for rotate). */
  typed: string;
}

/** What the viewer measures while a transform follows the mouse. */
export interface TransformInput {
  /** Grab: displacement of the pivot in the plane facing the camera (m). */
  world?: Vec3;
  /** Scale: mouse distance to the pivot ÷ the distance at the start. */
  factor?: number;
  /** Rotate: turn of the mouse around the pivot on screen (radians, counter-clockwise). */
  angle?: number;
  /** Unit vector from the scene towards the camera. */
  toCamera: Vec3;
}

export const PROPORTIONAL_RADIUS_BOUNDS = { min: 5, max: 600 } as const;

const parseTyped = (typed: string): number | null => {
  if (typed === '' || typed === '-' || typed === '.') return null;
  const v = Number(typed);
  return Number.isFinite(v) ? v : null;
};

const AXIS_VECTORS: Record<Axis, Vec3> = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };

/**
 * Selection and transforms of the pattern points on the 3D garment (edit mode). Selection keys are
 * `pieceId#index`, each remembering the panel it was picked on (the half of a fold piece the user looks at).
 * A transform is one undo step; Escape / right click cancels it entirely.
 */
export const useMeshEdit = (draft: PatternDraft | null | undefined) => {
  const [selection, setSelection] = useState<ReadonlyMap<string, string | null>>(new Map());
  const [proportional, setProportional] = useState<Proportional>({ enabled: false, radiusMm: 80, falloff: 'smooth' });
  const [xray, setXray] = useState(false);
  const [modal, setModal] = useState<ModalState | null>(null);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const session = useRef<{ snapshot: PatternPieceDto[]; selected: SelectedPoint[]; begun: boolean; last: TransformInput | null } | null>(null);
  const modalRef = useRef<ModalState | null>(null);
  modalRef.current = modal;
  const proportionalRef = useRef(proportional);
  proportionalRef.current = proportional;

  const select = useCallback((key: string | null, panelId: string | null, extend: boolean) => {
    setSelection((previous) => {
      if (!key) return extend ? previous : new Map();
      const next = new Map(extend ? previous : []);
      // Shift + click on a selected point deselects it, as in Blender.
      if (extend && previous.has(key)) next.delete(key);
      else next.set(key, panelId);
      return next;
    });
  }, []);

  const selectMany = useCallback((entries: Array<{ key: string; panelId: string }>, extend: boolean) => {
    setSelection((previous) => {
      const next = new Map(extend ? previous : []);
      for (const e of entries) if (!next.has(e.key)) next.set(e.key, e.panelId);
      return next;
    });
  }, []);

  /** A: everything (or nothing when everything is already selected). */
  const toggleAll = useCallback((instances: PointInstance[]) => {
    setSelection((previous) => {
      const keys = new Set(instances.map((i) => i.key));
      if (keys.size > 0 && [...keys].every((k) => previous.has(k))) return new Map();
      const next = new Map<string, string | null>();
      for (const i of instances) if (!next.has(i.key)) next.set(i.key, previous.get(i.key) ?? i.panelId);
      return next;
    });
  }, []);

  const deselectAll = useCallback(() => setSelection(new Map()), []);

  /** L: every point of the piece under the cursor. */
  const selectPiece = useCallback((pieceId: string, instances: PointInstance[], extend: boolean) => {
    setSelection((previous) => {
      const next = new Map(extend ? previous : []);
      for (const i of instances) if (i.pieceId === pieceId && !next.has(i.key)) next.set(i.key, i.panelId);
      return next;
    });
  }, []);

  /** Ctrl + L: every point of the pieces the selection touches. */
  const selectLinked = useCallback((instances: PointInstance[]) => {
    setSelection((previous) => {
      const pieces = new Set([...previous.keys()].map((k) => k.slice(0, k.lastIndexOf('#'))));
      const next = new Map(previous);
      for (const i of instances) if (pieces.has(i.pieceId) && !next.has(i.key)) next.set(i.key, i.panelId);
      return next;
    });
  }, []);

  const compute = useCallback((input: TransformInput): PatternPieceDto[] | null => {
    const s = session.current;
    const m = modalRef.current;
    if (!s || !m) return null;
    const typed = parseTyped(m.typed);
    const prop = proportionalRef.current;
    switch (m.kind) {
      case 'grab': {
        // A typed value is a distance in cm along the axis (X when none is chosen).
        const world: Vec3 =
          typed !== null
            ? (AXIS_VECTORS[m.axis ?? 'x'].map((a) => (a * typed) / 100) as Vec3)
            : constrain(input.world ?? [0, 0, 0], m.axis);
        return grabPoints(s.snapshot, s.selected, world, prop);
      }
      case 'scale':
        return scalePoints(s.snapshot, s.selected, typed ?? input.factor ?? 1, m.axis, prop);
      case 'rotate':
        return rotatePoints(s.snapshot, s.selected, typed !== null ? (typed * Math.PI) / 180 : (input.angle ?? 0), input.toCamera, prop);
    }
  }, []);

  const apply = useCallback(
    (input: TransformInput) => {
      const s = session.current;
      const current = draftRef.current;
      if (!s || !current) return;
      s.last = input;
      const next = compute(input);
      if (!next) return;
      if (!s.begun) {
        current.begin();
        s.begun = true;
      }
      current.update(() => next);
    },
    [compute],
  );

  /** G / S / R: starts a transform of the selection (false when nothing is selected). */
  const startTransform = useCallback(
    (kind: TransformKind, instances: PointInstance[]): boolean => {
      const current = draftRef.current;
      if (!current || modalRef.current) return false;
      const selected = resolveSelection(instances, selection);
      if (selected.length === 0) return false;
      session.current = { snapshot: current.pieces, selected, begun: false, last: null };
      const next = { kind, axis: null, typed: '' };
      modalRef.current = next;
      setModal(next);
      return true;
    },
    [selection],
  );

  const reapply = useCallback(
    (next: ModalState) => {
      modalRef.current = next;
      setModal(next);
      const last = session.current?.last;
      apply(last ?? { toCamera: [0, 0, 1] });
    },
    [apply],
  );

  /** X / Y / Z during a transform; the same key again removes the constraint. */
  const setAxis = useCallback(
    (axis: Axis) => {
      const m = modalRef.current;
      if (m) reapply({ ...m, axis: m.axis === axis ? null : axis });
    },
    [reapply],
  );

  /** Digits, '.', '-' and Backspace during a transform. */
  const typeKey = useCallback(
    (key: string) => {
      const m = modalRef.current;
      if (!m) return;
      if (key === 'Backspace') reapply({ ...m, typed: m.typed.slice(0, -1) });
      else if (key === '-') reapply({ ...m, typed: m.typed.startsWith('-') ? m.typed.slice(1) : `-${m.typed}` });
      else if (/^[0-9.]$/.test(key)) reapply({ ...m, typed: m.typed + key });
    },
    [reapply],
  );

  const confirm = useCallback(() => {
    session.current = null;
    modalRef.current = null;
    setModal(null);
  }, []);

  const cancel = useCallback(() => {
    const s = session.current;
    if (s?.begun) draftRef.current?.cancel();
    session.current = null;
    modalRef.current = null;
    setModal(null);
  }, []);

  const commitPieces = useCallback((fn: (pieces: PatternPieceDto[]) => PatternPieceDto[]) => {
    const current = draftRef.current;
    if (!current) return;
    current.commit(fn);
  }, []);

  /** X / Delete: removes the selected points. */
  const deleteSelected = useCallback(() => {
    if (selection.size === 0) return;
    const keys = [...selection.keys()];
    commitPieces((pieces) => deletePoints(pieces, keys));
    setSelection(new Map());
  }, [commitPieces, selection]);

  /** A point in the middle of every selected edge (both ends selected). */
  const subdivideSelected = useCallback(() => {
    const current = draftRef.current;
    if (!current || selection.size < 2) return;
    const result = subdividePoints(current.pieces, selection.keys());
    if (result.pieces.every((p, i) => p === current.pieces[i])) return;
    current.commit(() => result.pieces);
    setSelection(new Map(result.keys.map((k) => [k, null])));
  }, [selection]);

  /** Ctrl + click on a seam: inserts a point there and selects it. */
  const insertAt = useCallback((pieceId: string, flat: { x: number; y: number }, panelId: string): boolean => {
    const current = draftRef.current;
    if (!current) return false;
    const result = insertPointAt(current.pieces, pieceId, flat, 40);
    if (!result) return false;
    current.commit(() => result.pieces);
    setSelection(new Map([[result.key, panelId]]));
    return true;
  }, []);

  /** The « Transformation » panel: moves the selection so its median lands on (x, y) mm. */
  const moveMedianTo = useCallback(
    (instances: PointInstance[], target: { x?: number; y?: number }) => {
      const current = draftRef.current;
      if (!current) return;
      const selected = resolveSelection(instances, selection);
      const median = selectionMedian(current.pieces, selected);
      if (!median) return;
      const dx = target.x !== undefined ? target.x - median.x : 0;
      const dy = target.y !== undefined ? target.y - median.y : 0;
      if (dx === 0 && dy === 0) return;
      current.commit((pieces) => offsetPoints(pieces, selected, dx, dy));
    },
    [selection],
  );

  // The radius can change during a transform (mouse wheel, as in Blender): the transform follows at once.
  const setProportionalRadius = useCallback(
    (radiusMm: number) => {
      const next = {
        ...proportionalRef.current,
        radiusMm: Math.round(Math.min(PROPORTIONAL_RADIUS_BOUNDS.max, Math.max(PROPORTIONAL_RADIUS_BOUNDS.min, radiusMm))),
      };
      proportionalRef.current = next;
      setProportional(next);
      const last = session.current?.last;
      if (last) apply(last);
    },
    [apply],
  );

  return useMemo(
    () => ({
      enabled: Boolean(draft),
      selection,
      select,
      selectMany,
      toggleAll,
      deselectAll,
      selectPiece,
      selectLinked,
      modal,
      startTransform,
      apply,
      setAxis,
      typeKey,
      confirm,
      cancel,
      deleteSelected,
      subdivideSelected,
      insertAt,
      moveMedianTo,
      proportional,
      toggleProportional: () => {
        const next = { ...proportionalRef.current, enabled: !proportionalRef.current.enabled };
        proportionalRef.current = next;
        setProportional(next);
        const last = session.current?.last;
        if (last) apply(last);
      },
      setProportionalRadius,
      setProportionalFalloff: (falloff: Falloff) => setProportional((p) => ({ ...p, falloff })),
      xray,
      setXray,
    }),
    [
      draft,
      selection,
      select,
      selectMany,
      toggleAll,
      deselectAll,
      selectPiece,
      selectLinked,
      modal,
      startTransform,
      apply,
      setAxis,
      typeKey,
      confirm,
      cancel,
      deleteSelected,
      subdivideSelected,
      insertAt,
      moveMedianTo,
      proportional,
      setProportionalRadius,
      xray,
    ],
  );
};

export type MeshEdit = ReturnType<typeof useMeshEdit>;
