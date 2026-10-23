'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import type { PatternPieceDto } from '@angaly/types';
import type { usePatternDraft } from './usePatternDraft';
import {
  flatDelta,
  preparePiece,
  pushOf,
  strokePiece,
  type Falloff,
  type PreparedPiece,
  type SculptAnchor,
  type SculptSettings,
  type SculptTool,
  type Vec3,
} from '../utils/garment3d/sculpt';

type PatternDraft = ReturnType<typeof usePatternDraft>;

export const SCULPT_RADIUS_BOUNDS = { min: 10, max: 400 } as const;

export const DEFAULT_SCULPT: SculptSettings = { tool: 'grab', radiusMm: 80, falloff: 'smooth' };

interface Gesture {
  anchors: SculptAnchor[];
  prepared: Map<string, PreparedPiece>;
  settings: SculptSettings;
  /** The undo step is opened on the first move: a click without a drag leaves no empty step. */
  begun: boolean;
}

/**
 * Modelling the pattern on the 3D garment: a drag on the fabric (anchors + world displacement, from the viewer)
 * becomes a stroke on the outline of every piece it reaches. The pieces live in the shared draft, so the 2D
 * views follow live, and a whole drag is ONE undo step.
 */
export const usePatternSculpt = (draft: PatternDraft | null | undefined) => {
  const [active, setActive] = useState(false);
  const [settings, setSettings] = useState<SculptSettings>(DEFAULT_SCULPT);
  // The brush also reaches the neighbouring pieces (front and back side seams, both hems) at once.
  const [propagate, setPropagate] = useState(true);
  /** The last drag would have crossed an outline: the shape stopped at its last valid state. */
  const [blocked, setBlocked] = useState(false);
  const gesture = useRef<Gesture | null>(null);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  const setTool = useCallback((tool: SculptTool) => setSettings((s) => ({ ...s, tool })), []);
  const setFalloff = useCallback((falloff: Falloff) => setSettings((s) => ({ ...s, falloff })), []);
  const setRadius = useCallback(
    (radiusMm: number) =>
      setSettings((s) => ({
        ...s,
        radiusMm: Math.round(Math.min(SCULPT_RADIUS_BOUNDS.max, Math.max(SCULPT_RADIUS_BOUNDS.min, radiusMm))),
      })),
    [],
  );

  const start = useCallback(
    (anchors: SculptAnchor[]): boolean => {
      const current = draftRef.current;
      if (!current || anchors.length === 0) return false;
      const prepared = new Map<string, PreparedPiece>();
      for (const anchor of anchors) {
        const piece = current.pieces.find((p) => p.id === anchor.pieceId);
        if (piece && !prepared.has(piece.id)) prepared.set(piece.id, preparePiece(piece, settings, anchor.flat));
      }
      if (prepared.size === 0) return false;
      gesture.current = { anchors: anchors.filter((a) => prepared.has(a.pieceId)), prepared, settings, begun: false };
      setBlocked(false);
      return true;
    },
    [settings],
  );

  const move = useCallback((world: Vec3): void => {
    const g = gesture.current;
    const current = draftRef.current;
    if (!g || !current) return;
    const results = new Map<string, PatternPieceDto>();
    let crossed = false;
    for (const anchor of g.anchors) {
      const prepared = g.prepared.get(anchor.pieceId)!;
      const d = flatDelta(anchor, world);
      const next = strokePiece(prepared, {
        ...g.settings,
        center: anchor.flat,
        delta: { x: d.x * anchor.weight, y: d.y * anchor.weight },
        push: pushOf(anchor, world) * anchor.weight,
      });
      if (next) results.set(anchor.pieceId, next);
      else crossed = true;
    }
    setBlocked(crossed);
    if (results.size === 0) return;
    if (!g.begun) {
      current.begin();
      g.begun = true;
    }
    current.update((all) => all.map((p) => results.get(p.id) ?? p));
  }, []);

  const end = useCallback((): void => {
    gesture.current = null;
  }, []);

  return useMemo(
    () => ({
      enabled: Boolean(draft),
      active: active && Boolean(draft),
      setActive,
      settings,
      setTool,
      setRadius,
      setFalloff,
      propagate,
      setPropagate,
      blocked,
      start,
      move,
      end,
    }),
    [draft, active, settings, setTool, setRadius, setFalloff, propagate, blocked, start, move, end],
  );
};

export type PatternSculpt = ReturnType<typeof usePatternSculpt>;
