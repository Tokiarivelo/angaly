import { useCallback, useRef, useState } from 'react';
import {
  nextTierOnSlowFrames,
  pickInitialTier,
  pushFrameTime,
  type DeviceHints,
  type QualityTierName,
} from '../utils/studio3d/studio-config';

/** What the browser tells about the device (phone, small window, little memory); a desktop when unknown (SSR). */
export const readDeviceHints = (): DeviceHints => {
  if (typeof window === 'undefined') return { coarsePointer: false, minSide: 1080 };
  const coarse = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return { coarsePointer: coarse, minSide: Math.min(window.innerWidth, window.innerHeight), deviceMemory: memory };
};

/**
 * The studio's quality tier: picked from the device, then stepped down one tier at a time while the measured frames
 * stay slow (see `nextTierOnSlowFrames`). Never steps back up by itself (no flicker between tiers).
 */
export const useStudioQuality = (
  hints: () => DeviceHints = readDeviceHints,
): { tier: QualityTierName; reportFrame: (dtMs: number) => void } => {
  const [tier, setTier] = useState<QualityTierName>(() => pickInitialTier(hints()));
  const times = useRef<number[]>([]);
  const current = useRef(tier);
  current.current = tier;

  const reportFrame = useCallback((dtMs: number) => {
    times.current = pushFrameTime(times.current, dtMs);
    const next = nextTierOnSlowFrames(current.current, times.current);
    if (next !== current.current) {
      current.current = next;
      times.current = [];
      setTier(next);
    }
  }, []);

  return { tier, reportFrame };
};
