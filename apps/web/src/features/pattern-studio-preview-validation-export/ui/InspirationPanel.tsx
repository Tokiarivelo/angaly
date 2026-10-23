'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Crop, ImageOff, Layers, RotateCcw, Wand2, ZoomIn, ZoomOut } from 'lucide-react';
import type { InspirationOverlay } from '../hooks/useInspirationOverlay';
import { FRONT_VISIBLE_SHARE, fromPhoto, pieceAt, type PhotoRect } from '../utils/garment3d/photo-frame';
import { InspirationOverlayCanvas } from './InspirationOverlayCanvas';

export interface InspirationPanelOverlay {
  data: InspirationOverlay;
  selectedPieceId: string | null;
  /** Piece names by id (for the caption). */
  pieceNames: Record<string, string>;
  onSelectPiece: (id: string) => void;
}

interface InspirationPanelProps {
  url: string | null;
  /** The pattern laid over the photo (absent: the photo alone). */
  overlay?: InspirationPanelOverlay | null | undefined;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
/** A press that moves less than this (px) is a click (selects the piece under it), not a drag. */
const CLICK_SLOP = 4;
/** Smallest box the calibration keeps (share of the photo). */
const MIN_RECT = 0.05;

type Handle = 'move' | 'nw' | 'ne' | 'sw' | 'se';

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** The photo's box inside its frame (object-contain). */
const containedBox = (cw: number, ch: number, nw: number, nh: number) => {
  if (cw <= 0 || ch <= 0 || nw <= 0 || nh <= 0) return { left: 0, top: 0, width: cw, height: ch };
  const scale = Math.min(cw / nw, ch / nh);
  const width = nw * scale;
  const height = nh * scale;
  return { left: (cw - width) / 2, top: (ch - height) / 2, width, height };
};

/** Moves or resizes the box by a drag of (dx, dy) (shares of the photo) from its state at the start. */
const dragRect = (start: PhotoRect, handle: Handle, dx: number, dy: number): PhotoRect => {
  if (handle === 'move') {
    const w = start.x1 - start.x0;
    const h = start.y1 - start.y0;
    const x0 = Math.min(1 - w, Math.max(0, start.x0 + dx));
    const y0 = Math.min(1 - h, Math.max(0, start.y0 + dy));
    return { x0, y0, x1: x0 + w, y1: y0 + h };
  }
  const r = { ...start };
  if (handle === 'nw' || handle === 'sw') r.x0 = Math.min(clamp01(start.x0 + dx), r.x1 - MIN_RECT);
  if (handle === 'ne' || handle === 'se') r.x1 = Math.max(clamp01(start.x1 + dx), r.x0 + MIN_RECT);
  if (handle === 'nw' || handle === 'ne') r.y0 = Math.min(clamp01(start.y0 + dy), r.y1 - MIN_RECT);
  if (handle === 'sw' || handle === 'se') r.y1 = Math.max(clamp01(start.y1 + dy), r.y0 + MIN_RECT);
  return r;
};

/**
 * The customer's inspiration photo, zoomable (wheel / buttons) and pannable (drag) for side-by-side checks. With the
 * pattern: each piece is laid where it falls on the model (the selected one lit up, a click picks the piece under it),
 * the parts of the model no piece covers show in red, and the garment's box can be set by hand (« Caler »).
 */
export const InspirationPanel: React.FC<InspirationPanelProps> = ({ url, overlay }) => {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [failed, setFailed] = useState(false);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [frameSize, setFrameSize] = useState({ w: 0, h: 0 });
  const [piecesOpacity, setPiecesOpacity] = useState(0.6);
  const [showPieces, setShowPieces] = useState(true);
  const [calibrating, setCalibrating] = useState(false);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const drag = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null);
  const handleDrag = useRef<{ handle: Handle; x: number; y: number; start: PhotoRect } | null>(null);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const update = () => setFrameSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const change = (factor: number): void => {
    setZoom((z) => {
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * factor));
      if (next === MIN_ZOOM) setOffset({ x: 0, y: 0 });
      return next;
    });
  };
  const reset = (): void => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const box = containedBox(frameSize.w, frameSize.h, natural?.w ?? 0, natural?.h ?? 0);
  const data = overlay?.data;
  const projection = data?.projection ?? null;
  const showOverlay = Boolean(overlay && projection && natural && !failed);

  /** A point of the screen as a share of the photo (zoom and pan included). */
  const photoPoint = (clientX: number, clientY: number): [number, number] | null => {
    const b = stageRef.current?.getBoundingClientRect();
    if (!b || b.width <= 0 || b.height <= 0) return null;
    return [(clientX - b.left) / b.width, (clientY - b.top) / b.height];
  };

  const selectAt = (clientX: number, clientY: number): void => {
    if (!overlay || !projection || !data) return;
    const p = photoPoint(clientX, clientY);
    if (!p) return;
    const [u, v] = fromPhoto(data.rect, p[0], p[1]);
    const id = pieceAt(projection, u, v);
    if (id) overlay.onSelectPiece(id);
  };

  const selected = overlay?.selectedPieceId && projection ? projection.pieces.get(overlay.selectedPieceId) : undefined;
  const selectedName = overlay?.selectedPieceId ? overlay.pieceNames[overlay.selectedPieceId] : undefined;
  const status = !overlay?.selectedPieceId
    ? null
    : !selected || (selected.front.length === 0 && selected.back.length === 0)
      ? 'pièce intérieure ou non drapée : elle ne se voit pas sur le modèle'
      : selected.frontShare < FRONT_VISIBLE_SHARE
        ? 'au dos : vue à travers le vêtement (hachures)'
        : 'visible de face (en surbrillance)';

  const rect = data?.rect;
  const handleStyle = 'absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-sm border border-[#041329] bg-[#FFC45C]';

  return (
    <section
      aria-label="Modèle d’inspiration"
      data-testid="inspiration-panel"
      className="sticky top-4 flex h-[calc(100vh-2rem)] max-h-[900px] min-h-[420px] min-w-0 flex-1 flex-col rounded-xl border border-[#C5B190]/30 bg-[#041329] p-3"
    >
      <header className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[#D8D3C8]">
        <span className="font-serif text-base text-white">Modèle d’inspiration</span>
        <div className="flex flex-wrap items-center gap-1.5">
          {overlay && projection && (
            <div className="flex items-center gap-1 rounded-lg border border-[#C5B190]/20 bg-[#0C2650] p-0.5">
              <button
                type="button"
                aria-pressed={showPieces}
                aria-label="Superposer le patron sur le modèle"
                title="Superposer le patron sur le modèle"
                onClick={() => setShowPieces((v) => !v)}
                className={`inline-flex items-center gap-1 rounded px-1.5 py-1 ${showPieces ? 'bg-[#C5B190] text-[#041329]' : 'hover:text-[#C5B190]'}`}
              >
                <Layers className="h-3.5 w-3.5" aria-hidden="true" /> Pièces
              </button>
              {showPieces && (
                <input
                  type="range"
                  aria-label="Opacité du patron"
                  min={0.1}
                  max={1}
                  step={0.05}
                  value={piecesOpacity}
                  onChange={(e) => setPiecesOpacity(Number(e.target.value))}
                  className="w-16 accent-[#C5B190]"
                />
              )}
              <button
                type="button"
                aria-pressed={calibrating}
                aria-label="Caler le patron sur le modèle"
                title="Caler : déplacer / étirer le cadre du vêtement sur la photo"
                onClick={() => setCalibrating((v) => !v)}
                className={`inline-flex items-center gap-1 rounded px-1.5 py-1 ${calibrating ? 'bg-[#C5B190] text-[#041329]' : 'hover:text-[#C5B190]'}`}
              >
                <Crop className="h-3.5 w-3.5" aria-hidden="true" /> Caler
              </button>
              {data?.calibrated && (
                <button
                  type="button"
                  aria-label="Recaler automatiquement"
                  title="Recaler automatiquement (cadre lu sur la photo)"
                  onClick={() => data.resetRect()}
                  className="rounded p-1 hover:text-[#C5B190]"
                >
                  <Wand2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          )}
          <div className="flex items-center gap-1 rounded-lg border border-[#C5B190]/20 bg-[#0C2650] p-0.5">
            <button type="button" aria-label="Dézoomer le modèle" onClick={() => change(1 / 1.3)} className="rounded p-1.5 hover:text-[#C5B190]">
              <ZoomOut className="h-4 w-4" aria-hidden="true" />
            </button>
            <button type="button" aria-label="Réinitialiser le modèle" onClick={reset} className="rounded p-1.5 hover:text-[#C5B190]">
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button type="button" aria-label="Zoomer le modèle" onClick={() => change(1.3)} className="rounded p-1.5 hover:text-[#C5B190]">
              <ZoomIn className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <div
        ref={frameRef}
        className="relative flex-1 overflow-hidden rounded-lg bg-[#0C2650]/60 touch-none select-none"
        style={{ cursor: calibrating ? 'default' : zoom > 1 ? 'grab' : showOverlay ? 'crosshair' : 'default' }}
        onWheel={(e) => change(e.deltaY < 0 ? 1.12 : 1 / 1.12)}
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY };
          e.currentTarget.setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={(e) => {
          const h = handleDrag.current;
          if (h && data) {
            const b = stageRef.current?.getBoundingClientRect();
            if (b && b.width > 0 && b.height > 0) data.setRect(dragRect(h.start, h.handle, (e.clientX - h.x) / b.width, (e.clientY - h.y) / b.height));
            return;
          }
          const start = drag.current;
          if (!start || zoom <= 1) return;
          const dx = e.clientX - start.x;
          const dy = e.clientY - start.y;
          drag.current = { ...start, x: e.clientX, y: e.clientY };
          setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
        }}
        onPointerUp={(e) => {
          const start = drag.current;
          const wasHandle = handleDrag.current !== null;
          drag.current = null;
          handleDrag.current = null;
          if (!wasHandle && !calibrating && start && Math.hypot(e.clientX - start.startX, e.clientY - start.startY) < CLICK_SLOP) selectAt(e.clientX, e.clientY);
        }}
        onPointerCancel={() => {
          drag.current = null;
          handleDrag.current = null;
        }}
      >
        {url && !failed ? (
          <div
            ref={stageRef}
            data-testid="inspiration-stage"
            className="absolute will-change-transform"
            style={{
              left: box.left,
              top: box.top,
              width: box.width,
              height: box.height,
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              transformOrigin: `${frameSize.w / 2 - box.left}px ${frameSize.h / 2 - box.top}px`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- MinIO URLs: arbitrary host, no optimizer. */}
            <img
              src={url}
              alt="Modèle d’inspiration du client"
              draggable={false}
              onLoad={(e) => setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
              onError={() => setFailed(true)}
              className="absolute inset-0 h-full w-full object-contain"
            />
            {showOverlay && projection && data && (
              <InspirationOverlayCanvas
                projection={projection}
                rect={data.rect}
                width={box.width}
                height={box.height}
                zoom={zoom}
                selectedPieceId={overlay?.selectedPieceId ?? null}
                piecesOpacity={showPieces ? piecesOpacity : 0}
                coverage={data.coverage}
                mask={data.mask}
              />
            )}
            {showOverlay && calibrating && rect && (
              <div
                data-testid="inspiration-calibration"
                className="absolute border-2 border-dashed border-[#FFC45C] bg-[#FFC45C]/5"
                style={{ left: `${rect.x0 * 100}%`, top: `${rect.y0 * 100}%`, width: `${(rect.x1 - rect.x0) * 100}%`, height: `${(rect.y1 - rect.y0) * 100}%`, cursor: 'move' }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  handleDrag.current = { handle: 'move', x: e.clientX, y: e.clientY, start: rect };
                  frameRef.current?.setPointerCapture?.(e.pointerId);
                }}
              >
                {(['nw', 'ne', 'sw', 'se'] as const).map((h) => (
                  <span
                    key={h}
                    role="presentation"
                    className={handleStyle}
                    style={{ left: h.endsWith('w') ? '0%' : '100%', top: h.startsWith('n') ? '0%' : '100%', cursor: h === 'nw' || h === 'se' ? 'nwse-resize' : 'nesw-resize' }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      handleDrag.current = { handle: h, x: e.clientX, y: e.clientY, start: rect };
                      frameRef.current?.setPointerCapture?.(e.pointerId);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center text-sm text-[#D8D3C8]">
            <ImageOff className="h-6 w-6 text-[#C5B190]" aria-hidden="true" />
            {failed ? 'La photo du modèle ne peut pas être chargée.' : 'Aucune photo d’inspiration pour ce projet.'}
          </div>
        )}
      </div>

      {showOverlay && (
        <footer className="mt-2 space-y-0.5 text-[11px] leading-snug text-[#D8D3C8]" data-testid="inspiration-caption">
          {selectedName && status && (
            <p>
              <span className="font-semibold text-[#FFC45C]">{selectedName}</span> — {status}
            </p>
          )}
          {data?.coverage && showPieces && (
            <p>
              Modèle couvert par le patron : <span className="font-semibold text-white">{Math.round(data.coverage.covered * 100)} %</span>
              {data.coverage.covered < 0.995 && <span className="text-[#F0A39B]"> · en rouge : parties du modèle qu’aucune pièce ne couvre</span>}
            </p>
          )}
          <p className="text-[#D8D3C8]/60">
            {calibrating ? 'Glissez le cadre ou ses coins sur le vêtement de la photo.' : 'Cliquez sur la photo pour choisir la pièce correspondante.'}
            {data?.calibrated ? ' Cadre calé à la main.' : data?.autoRect ? ' Cadre lu sur la photo.' : ''}
          </p>
        </footer>
      )}
    </section>
  );
};
