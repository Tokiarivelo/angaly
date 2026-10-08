'use client';

import { useEffect, useState } from 'react';

export const GENERATION_STAGES = [
  'Lecture de vos mensurations',
  'Application de vos choix de coupe et d’aisance',
  'Construction des pièces du patron',
  'Contrôle de la géométrie',
] as const;

/** A few seconds per stage; stays on the last one until the generation ends. */
const STAGE_DURATION_MS = 2500;
const SLOW_AFTER_SECONDS = 15;

/** Purely visual progress for the generation screen: current stage, elapsed time, "taking long" flag. */
export function useGenerationProgress(active = true) {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!active) return;
    const startedAt = Date.now();
    const timer = setInterval(() => setElapsedMs(Date.now() - startedAt), 500);
    return () => clearInterval(timer);
  }, [active]);

  return {
    stageIndex: Math.min(Math.floor(elapsedMs / STAGE_DURATION_MS), GENERATION_STAGES.length - 1),
    elapsedSeconds: Math.floor(elapsedMs / 1000),
    isSlow: elapsedMs / 1000 >= SLOW_AFTER_SECONDS,
  };
}
