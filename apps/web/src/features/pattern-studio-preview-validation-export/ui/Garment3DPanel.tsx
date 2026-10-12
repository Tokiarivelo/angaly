'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Hand, Maximize2, Minimize2, Pause, Play, RotateCcw } from 'lucide-react';
import type { ViewName, ViewRequest } from './Garment3DViewer';
import type { FabricLook } from './fabricTextures';
import { WebGlBoundary } from './WebGlBoundary';
import type { PatternPieceDto } from '@angaly/types';
import { buildGarmentModel, type FitStatus } from '../utils/garment3d/garment-model';
import { BODY_TEMPLATES, suggestTemplate, type BodyTemplateId } from '../utils/garment3d/body-templates';

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
  /** Fabric read from the inspiration photo (print, colours), shown on the 3D garment. */
  fabric?: FabricLook | null | undefined;
}

const STATUS_LABELS: Record<FitStatus, { label: string; className: string }> = {
  tight: { label: 'Trop serré', className: 'bg-[#A64A43]/20 text-[#F0B3AD] border-[#A64A43]/50' },
  fitted: { label: 'Ajusté', className: 'bg-[#C5B190]/15 text-[#C5B190] border-[#C5B190]/40' },
  comfortable: { label: 'Confortable', className: 'bg-[#46745A]/20 text-[#9CD0B1] border-[#46745A]/50' },
  loose: { label: 'Ample', className: 'bg-[#7F95B8]/20 text-[#BCCBE6] border-[#7F95B8]/50' },
};

const ANIMATION_MS = 2400;

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

export const Garment3DPanel: React.FC<Garment3DPanelProps> = ({
  pieces,
  garmentType,
  measurements,
  selectedPieceId,
  fabric,
}) => {
  const [assembly, setAssembly] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showMannequin, setShowMannequin] = useState(true);
  const [transparent, setTransparent] = useState(false);
  // Hand tool: the left button moves the scene instead of rotating it.
  const [panMode, setPanMode] = useState(false);
  // Full screen: the whole panel (stage, controls, settings) covers the window; Escape leaves it.
  const [fullscreen, setFullscreen] = useState(false);
  const [viewRequest, setViewRequest] = useState<ViewRequest | null>(null);
  const [viewerKey, setViewerKey] = useState(0);
  const [contextLost, setContextLost] = useState(false);
  const frame = useRef<number | null>(null);
  // Starts on the silhouette closest to the customer's measurements; the user can pick another one.
  const [templateId, setTemplateId] = useState<BodyTemplateId>(() => suggestTemplate(measurements));

  const result = useMemo(
    () => buildGarmentModel(pieces, garmentType, measurements, templateId),
    [pieces, garmentType, measurements, templateId],
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

  useEffect(() => {
    if (!fullscreen) return undefined;
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [fullscreen]);

  const requestView = (view: ViewName): void => {
    setViewRequest((previous) => ({ view, nonce: (previous?.nonce ?? 0) + 1 }));
  };

  // Blender numpad habits: 1 front, Ctrl+1 / 9 back, 3 side, 7 top, Home or 5 reset.
  const handleStageKey = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    const views: Record<string, ViewName> = { '1': 'front', '3': 'side', '7': 'top', '9': 'back', Home: 'reset' };
    const view = event.ctrlKey && event.key === '1' ? 'back' : views[event.key];
    if (view) {
      event.preventDefault();
      requestView(view);
    }
  };

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
    <div
      data-testid="garment-3d-panel"
      data-fullscreen={String(fullscreen)}
      className={
        fullscreen
          ? 'fixed inset-0 z-[100] overflow-y-auto bg-[#041329] p-4 sm:p-6 flex flex-col gap-4'
          : 'flex-1 min-h-[440px] bg-[#041329] border border-[#C5B190]/30 rounded-xl p-4 sm:p-6 flex flex-col gap-4'
      }
    >
      <div
        className={`relative rounded-lg overflow-hidden border border-[#C5B190]/20 focus:outline-none focus:ring-1 focus:ring-[#C5B190] ${
          fullscreen ? 'flex-1 min-h-[300px]' : 'h-[420px]'
        }`}
        data-testid="garment-3d-stage"
        tabIndex={0}
        onKeyDown={handleStageKey}
      >
        <WebGlBoundary
          key={viewerKey}
          forceError={contextLost}
          onRetry={() => {
            setContextLost(false);
            setViewerKey((k) => k + 1);
          }}
        >
          <Garment3DViewer
            model={model}
            assembly={assembly}
            showMannequin={showMannequin}
            transparent={transparent}
            panMode={panMode}
            selectedPieceId={selectedPieceId}
            viewRequest={viewRequest}
            onContextLost={() => setContextLost(true)}
            fabric={fabric}
          />
        </WebGlBoundary>
        <p className="pointer-events-none absolute bottom-2 left-3 text-[11px] text-[#D8D3C8]/60">
          Glisser : tourner · outil Main, Maj + glisser ou clic droit : déplacer · molette : zoomer
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

        <button
          type="button"
          aria-pressed={fullscreen}
          onClick={() => setFullscreen((v) => !v)}
          title={fullscreen ? 'Quitter le plein écran (Échap)' : 'Afficher en plein écran'}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0C2650] border border-[#C5B190]/30 text-[#C5B190] hover:border-[#C5B190] order-last"
        >
          {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          {fullscreen ? 'Quitter le plein écran' : 'Plein écran'}
        </button>
        <button
          type="button"
          aria-pressed={panMode}
          onClick={() => setPanMode((v) => !v)}
          title="Outil Main : glisser pour déplacer le rendu 3D"
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${
            panMode
              ? 'bg-[#C5B190] text-[#041329] border-[#C5B190]'
              : 'bg-[#0C2650] border-[#C5B190]/30 text-[#C5B190] hover:border-[#C5B190]'
          }`}
        >
          <Hand className="w-3.5 h-3.5" />
          Main
        </button>

        <div role="group" aria-label="Vues" className="flex items-center gap-1">
          {(
            [
              ['front', 'Face'],
              ['back', 'Dos'],
              ['side', 'Côté'],
              ['top', 'Dessus'],
              ['reset', 'Recentrer'],
            ] as Array<[ViewName, string]>
          ).map(([view, label]) => (
            <button
              key={view}
              type="button"
              onClick={() => requestView(view)}
              className="px-2.5 py-1.5 rounded-lg bg-[#0C2650] border border-[#C5B190]/30 text-[#C5B190] hover:border-[#C5B190]"
            >
              {label}
            </button>
          ))}
        </div>

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
          <span className="whitespace-nowrap">Morphologie</span>
          <select
            aria-label="Morphologie du mannequin"
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value as BodyTemplateId)}
            className="bg-[#0C2650] border border-[#C5B190]/30 text-[#D8D3C8] text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#C5B190]"
          >
            {BODY_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
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
        Les panneaux suivent les largeurs réelles des pièces du patron sur un mannequin ajusté à vos mesures (les mesures manquantes viennent de la morphologie choisie) ; la chute du
        tissu n’est pas simulée.
        {model.generic &&
          ' Aucune pièce devant/dos : la plus grande pièce est enroulée autour du corps (représentation indicative).'}
        {model.ignored.length > 0 && ` Non placé(es) sur le mannequin : ${model.ignored.join(', ')}.`}
      </p>
    </div>
  );
};
