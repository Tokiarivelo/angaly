import { useEffect, useState } from 'react';

/**
 * Runs a shader warm-up (see `utils/studio3d/shader-warmup.ts`) and tells when it is over. A failed warm-up still
 * ends as "ready": the frame then compiles the programs itself, slower but correct. `warm` null ⇒ nothing to wait for.
 * A new `warm` function starts a new warm-up; a result arriving after unmount or after a newer warm-up is ignored.
 */
export const useShaderWarmup = (warm: (() => Promise<unknown>) | null): boolean => {
  const [readyFor, setReadyFor] = useState<(() => Promise<unknown>) | null>(null);

  useEffect(() => {
    if (!warm) return undefined;
    let live = true;
    const done = (): void => {
      if (live) setReadyFor(() => warm);
    };
    let pending: Promise<unknown>;
    try {
      pending = warm();
    } catch {
      done();
      return () => {
        live = false;
      };
    }
    pending.then(done, done);
    return () => {
      live = false;
    };
  }, [warm]);

  return warm === null || readyFor === warm;
};
