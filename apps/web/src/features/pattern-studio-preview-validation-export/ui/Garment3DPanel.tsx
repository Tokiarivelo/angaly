'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Pause, Play, RotateCcw } from 'lucide-react';
import type { PatternPieceDto } from '@angaly/types';
import { buildGarmentModel, type FitStatus } from '../utils/garment3d/garment-model';

// three.js is only downloaded when the 3D tab is opened.
const Garment3DViewer = dynamic(() => import('./Garment3DViewer').then((m) => m.Garment3DViewer), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center text-sm text-[#D8D3C8]">
      Chargement de la 3D…
    </div>
  ),
});

interface Garment3DPanelProps {
  pieces: PatternPieceDto[];
  garmentType: string;
  measurements: Record<string, number> | null | undefined;
  selectedPieceId: string | null;
}

const STATUS_LABELS: Record<FitStatus, { label: string; className: string }> = {
  tight: { label: 'Trop serré', className: 'bg-[#A64A43]/20 text-[#F0B3AD] border-[#A64A43]/50' },
  fitted: { label: 'Ajusté', className: 'bg-[#C5B190]/15 text-[#C5B190] border-[#C5B190]/40' },
  comfortable: { label: 'Confortable', className: 'bg-[#46745A]/20 text-[#9CD0B1] border-[#46745A]/50' },
  loose: { label: 'Ample', className: 'bg-[#7F95B8]/20 text-[#BCCBE6] border-[#7F95B8]/50' },
};

const ANIMATION_MS = 2400;

const supportsWebGl = (): boolean => {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
};

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

export const Garment3DPanel: React.FC<Garment3DPanelProps> = ({
  pieces,
  garmentType,
  measurements,
  selectedPieceId,
}) => {
  const [assembly, setAssembly] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showMannequin, setShowMannequin] = useState(true);
  const [transparent, setTransparent] = useState(false);
  const [webGl, setWebGl] = useState<boolean | null>(null);
  const frame = useRef<number | null>(null);

  useEffect(() => setWebGl(supportsWebGl()), []);

  const result = useMemo(
    () => buildGarmentModel(pieces, garmentType, measurements),
    [pieces, garmentType, measurements],
  );

  // Assembly animation: 0 → 1 over ~2.4 s, one state update per animation frame.
  useEffect(() => {
    if (!isPlaying) return undefined;
    const startValue = assembly >= 1 ? 0 : assembly;
    const startedAt = performance.now();
    const tick = (now: number): void => {
      const progress = Math.min(1, startValue + (now - startedAt) / ANIMATION_MS);
      setAssembly(progress);
      if (progress < 1) {
        frame.current = requestAnimationFrame(tick);
      } else {
        setIsPlaying(false);
      }
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
    // The animation restarts only when playback is toggled, not on every assembly update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  const handlePlay = (): void => {
    if (prefersReducedMotion()) {
      setAssembly((value) => (value >= 1 ? 0 : 1));
      return;
    }
    setIsPlaying((value) => !value);
  };

  if (!result.ok) {
    return (
      <div
        data-testid="garment-3d-unsupported"
        className="flex-1 min-h-[440px] bg-[#041329] border border-[#C5B190]/30 rounded-xl p-8 flex items-center justify-center text-center text-sm text-[#D8D3C8]"
      >
        {result.reason}
      </div>
    );
  }

  const { model } = result;

  return (
    <div className="flex-1 min-h-[440px] bg-[#041329] border border-[#C5B190]/30 rounded-xl p-4 sm:p-6 flex flex-col gap-4">
      <div className="relative h-[380px] rounded-lg overflow-hidden border border-[#C5B190]/20" data-testid="garment-3d-stage">
        {webGl === false ? (
          <div className="h-full flex items-center justify-center p-6 text-center text-sm text-[#D8D3C8]">
            Votre navigateur ne permet pas l’affichage 3D (WebGL indisponible). La vue 2D reste disponible.
          </div>
        ) : webGl === true ? (
          <Garment3DViewer
            model={model}
            assembly={assembly}
            showMannequin={showMannequin}
            transparent={transparent}
            selectedPieceId={selectedPieceId}
          />
        ) : null}
        <p className="pointer-events-none absolute bottom-2 left-3 text-[11px] text-[#D8D3C8]/60">
          Glisser pour tourner · molette pour zoomer
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-[#D8D3C8]">
        <button
          type="button"
          onClick={handlePlay}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0C2650] border border-[#C5B190]/30 text-[#C5B190] hover:border-[#C5B190]"
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          {isPlaying ? 'Pause' : 'Assembler'}
        </button>
        <button
          type="button"
          onClick={() => {
            setIsPlaying(false);
            setAssembly(0);
          }}
          aria-label="Éclater les pièces"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0C2650] border border-[#C5B190]/30 text-[#C5B190] hover:border-[#C5B190]"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Éclater
        </button>

        <label className="flex items-center gap-2 grow min-w-[180px]">
          <span className="whitespace-nowrap">Assemblage</span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(assembly * 100)}
            onChange={(e) => {
              setIsPlaying(false);
              setAssembly(Number(e.target.value) / 100);
            }}
            className="w-full accent-[#C5B190]"
          />
          <span className="font-mono w-9 text-right">{Math.round(assembly * 100)}%</span>
        </label>

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={showMannequin} onChange={(e) => setShowMannequin(e.target.checked)} />
          Mannequin
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={transparent} onChange={(e) => setTransparent(e.target.checked)} />
          Transparence
        </label>
      </div>

      {model.fit.length > 0 && (
        <div data-testid="garment-fit-report">
          <h3 className="text-xs uppercase tracking-wider text-[#C5B190] mb-2">
            Aisance mesurée sur le patron
          </h3>
          <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {model.fit.map((line) => {
              const status = STATUS_LABELS[line.status];
              return (
                <li key={line.label} className="rounded-lg bg-[#0C2650] border border-[#C5B190]/20 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-white text-sm">{line.label}</span>
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] ${status.className}`}>
                      {status.label}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-[#D8D3C8]">
                    Corps {line.bodyCm} cm · Vêtement {line.garmentCm} cm ·{' '}
                    <strong className="text-white">
                      {line.easeCm >= 0 ? '+' : ''}
                      {line.easeCm} cm
                    </strong>
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <p className="text-[11px] text-[#D8D3C8]/70 leading-relaxed">
        Les panneaux suivent les largeurs réelles des pièces du patron sur un mannequin à vos mesures ; la chute du
        tissu n’est pas simulée.
        {model.ignored.length > 0 && ` Non placé(es) sur le mannequin : ${model.ignored.join(', ')}.`}
      </p>
    </div>
  );
};
