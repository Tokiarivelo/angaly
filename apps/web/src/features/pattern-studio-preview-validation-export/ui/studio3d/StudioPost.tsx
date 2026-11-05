'use client';

import type React from 'react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { QualityTierName } from '../../utils/studio3d/studio-config';
import { createStudioComposer } from '../../utils/studio3d/studio-composer';
import { warmComposer } from '../../utils/studio3d/shader-warmup';
import { useShaderWarmup } from '../../hooks/useShaderWarmup';

/**
 * Draws the canvas through the studio's passes (MSAA, GTAO, tone mapping). `useFrame` at priority 1 takes the
 * rendering over from R3F (still on demand); the navigation gizmo is drawn after, at priority 2.
 * Nothing is drawn until the shaders are compiled (`onReadyChange`): no frozen first frame.
 */
export const StudioPost: React.FC<{
  tier: QualityTierName;
  /** AO off whatever the tier (see-through garment: the hidden body would shade it). */
  aoAllowed: boolean;
  /** AO strength (0–1); the studio default when absent. Fixed at mount. */
  aoBlend?: number | undefined;
  /** A new value warms the shaders again (e.g. once the scanned body replaced the procedural one). */
  warmKey: string;
  onReadyChange?: ((ready: boolean) => void) | undefined;
  /** Time between two consecutive frames, for the automatic quality step-down. */
  onFrame?: ((dtMs: number) => void) | undefined;
}> = ({ tier, aoAllowed, aoBlend, warmKey, onReadyChange, onFrame }) => {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const dpr = useThree((state) => state.viewport.dpr);
  const invalidate = useThree((state) => state.invalidate);

  // The tier at creation only: later changes go through setQuality (no new composer, no new targets).
  const initial = useRef({ tier, aoAllowed, aoBlend });
  const post = useMemo(
    () => createStudioComposer(gl, scene, camera, initial.current.tier, initial.current.aoAllowed, initial.current.aoBlend),
    [gl, scene, camera],
  );
  useEffect(() => () => post.dispose(), [post]);
  useEffect(() => {
    post.setSize(size.width, size.height, dpr);
    invalidate();
  }, [post, size.width, size.height, dpr, invalidate]);
  useEffect(() => {
    post.setQuality(tier, aoAllowed);
    invalidate();
  }, [post, tier, aoAllowed, invalidate]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const warm = useCallback(() => warmComposer(gl, post.composer, scene, camera), [gl, post, scene, camera, warmKey]);
  const ready = useShaderWarmup(warm);
  const everReady = useRef(false);
  if (ready) everReady.current = true;
  const report = useRef(onReadyChange);
  report.current = onReadyChange;
  useEffect(() => {
    report.current?.(everReady.current);
    if (ready) invalidate();
  }, [ready, invalidate]);

  const last = useRef<number | null>(null);
  useFrame(() => {
    // Only the very first warm-up holds the frame; later ones compile in the background.
    if (!everReady.current) return;
    post.render();
    const now = performance.now();
    if (last.current !== null) onFrame?.(now - last.current);
    last.current = now;
  }, 1);
  return null;
};
