'use client';

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { PatternPieceDto } from '@angaly/types';
import {
  formatCm,
  getBounds,
  getEdges,
  getNotchMarks,
  niceScaleLengthMm,
  offsetPolygon,
  type Point,
} from '../../utils/pattern-geometry';
import {
  constrainAngle,
  insertPoint,
  movePoint,
  nearestOnOutline,
  nearestVertex,
  pieceNotches,
  pieceOutline,
  pointInPolygon,
  removePoint,
  snapPoint,
  toggleNotch,
  translatePolygon,
  withOutline,
} from '../../utils/pattern-editing';
import {
  fitViewport,
  gridStepFor,
  panByPx,
  screenToWorld,
  viewBoxOf,
  zoomAt,
  zoomPercent,
  type Size,
  type Viewport,
} from '../../utils/studio-viewport';
import type { StudioTool } from './studio.types';

export interface StudioCanvasProps {
  piece: PatternPieceDto | null;
  tool: StudioTool;
  /** Grid / snapping step in mm (0 = no snapping). */
  snapMm: number;
  showGrid: boolean;
  showLengths: boolean;
  selectedPoint: number | null;
  highlightEdge: number | null;
  /** Incremented to ask for a "fit to screen". */
  fitRequest: number;
  onSelectPoint: (index: number | null) => void;
  /** Applies ONE undo step to the active piece. */
  onCommitPiece: (fn: (piece: PatternPieceDto) => PatternPieceDto) => void;
  onCreatePiece: (polygon: Point[]) => void;
  onZoomChange?: ((percent: number) => void) | undefined;
}

export const DEFAULT_CANVAS_SIZE: Size = { width: 800, height: 520 };

const GOLD = '#C5B190';
const BRONZE = '#936C3E';
const NAVY = '#041329';
const HANDLE_REACH_PX = 11;
const EDGE_REACH_PX = 12;
const CURSOR_TOOLS: ReadonlySet<StudioTool> = new Set(['add', 'draw', 'measure', 'notch', 'grain']);

type Gesture =
  | { kind: 'vertex'; index: number; base: PatternPieceDto }
  | { kind: 'body'; start: Point; base: PatternPieceDto }
  | { kind: 'grain'; origin: Point; base: PatternPieceDto }
  | { kind: 'pan'; lastX: number; lastY: number };

const toPoints = (pts: Point[]): string => pts.map((p) => `${p.x},${p.y}`).join(' ');

export const StudioCanvas: React.FC<StudioCanvasProps> = ({
  piece,
  tool,
  snapMm,
  showGrid,
  showLengths,
  selectedPoint,
  highlightEdge,
  fitRequest,
  onSelectPoint,
  onCommitPiece,
  onCreatePiece,
  onZoomChange,
}) => {
  const uid = useId().replace(/:/g, '');
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState<Size>(DEFAULT_CANVAS_SIZE);
  const [vp, setVp] = useState<Viewport>({ cx: 0, cy: 0, mmPerPx: 1 });
  // Local, per-frame copy of the piece while a gesture is running: the rest of the page only
  // re-renders once, on release.
  const [live, setLive] = useState<PatternPieceDto | null>(null);
  const [cursor, setCursor] = useState<Point | null>(null);
  const [drawing, setDrawing] = useState<Point[]>([]);
  const [ruler, setRuler] = useState<{ a: Point; b: Point | null } | null>(null);
  const [spaceDown, setSpaceDown] = useState(false);
  const [panning, setPanning] = useState(false);

  const gesture = useRef<Gesture | null>(null);
  const pending = useRef<PatternPieceDto | null>(null);
  const frame = useRef<number | null>(null);
  const cursorFrame = useRef<number | null>(null);
  const cursorNext = useRef<Point | null>(null);
  const pointers = useRef(new Map<number, Point>());
  const pinch = useRef<{ distance: number } | null>(null);
  const fitted = useRef('');

  const shown = live ?? piece;
  const polygon = useMemo(() => (shown ? pieceOutline(shown) : []), [shown]);
  const notches = useMemo(() => (shown ? pieceNotches(shown) : []), [shown]);
  const allowanceMm = (shown?.seamAllowanceCm ?? 0) * 10;
  const cutLine = useMemo(() => (allowanceMm > 0 ? offsetPolygon(polygon, allowanceMm) : []), [polygon, allowanceMm]);
  const edges = useMemo(() => getEdges(polygon), [polygon]);

  // ---- size tracking ------------------------------------------------------------------------
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(([entry]) => {
      const rect = entry?.contentRect;
      if (rect && rect.width > 0 && rect.height > 0) {
        setSize((prev) =>
          Math.abs(prev.width - rect.width) < 0.5 && Math.abs(prev.height - rect.height) < 0.5
            ? prev
            : { width: rect.width, height: rect.height },
        );
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // ---- fit to screen: when the piece changes or on request (never while the user edits it) --------
  useEffect(() => {
    const key = `${piece?.id ?? ''}|${fitRequest}|${Math.round(size.width / 40)}`;
    if (fitted.current === key) return;
    fitted.current = key;
    const outline = piece ? pieceOutline(piece) : [];
    if (outline.length === 0) return;
    const withCut = [...outline, ...offsetPolygon(outline, (piece?.seamAllowanceCm ?? 0) * 10)];
    setVp(fitViewport(getBounds(withCut), size));
  }, [piece, fitRequest, size]);

  useEffect(() => {
    onZoomChange?.(zoomPercent(vp));
  }, [vp, onZoomChange]);

  // ---- wheel zoom (non-passive so the page does not scroll) ---------------------------------------
  const vpRef = useRef(vp);
  vpRef.current = vp;
  const sizeRef = useRef(size);
  sizeRef.current = size;
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return undefined;
    const onWheel = (e: WheelEvent): void => {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const factor = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0016));
      setVp((v) => zoomAt(v, sizeRef.current, e.clientX - rect.left, e.clientY - rect.top, factor));
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, []);

  // ---- space bar = temporary hand tool ------------------------------------------------------------
  useEffect(() => {
    const down = (e: KeyboardEvent): void => {
      if (e.code === 'Space' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        if (wrapRef.current?.contains(document.activeElement) || document.activeElement === document.body) {
          e.preventDefault();
          setSpaceDown(true);
        }
      }
    };
    const up = (e: KeyboardEvent): void => {
      if (e.code === 'Space') setSpaceDown(false);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  // Leaving a tool abandons its half-finished work.
  useEffect(() => {
    setDrawing([]);
    setRuler(null);
    setCursor(null);
  }, [tool, piece?.id]);

  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      if (cursorFrame.current !== null) cancelAnimationFrame(cursorFrame.current);
    },
    [],
  );

  // The coordinate readout / rubber band follows the pointer at most once per animation frame.
  const trackCursor = useCallback((point: Point | null) => {
    cursorNext.current = point;
    if (cursorFrame.current !== null) return;
    cursorFrame.current = requestAnimationFrame(() => {
      cursorFrame.current = null;
      setCursor(cursorNext.current);
    });
  }, []);

  // ---- helpers ----------------------------------------------------------------------------------
  const measureRect = useCallback((): { left: number; top: number; size: Size } => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect && rect.width > 0 && rect.height > 0) {
      return { left: rect.left, top: rect.top, size: { width: rect.width, height: rect.height } };
    }
    return { left: 0, top: 0, size: sizeRef.current };
  }, []);

  const toWorld = useCallback(
    (clientX: number, clientY: number): Point => {
      const r = measureRect();
      return screenToWorld(vpRef.current, r.size, clientX - r.left, clientY - r.top);
    },
    [measureRect],
  );

  const snap = useCallback(
    (p: Point, event: { altKey: boolean; shiftKey: boolean }, anchor?: Point, skipIndex?: number): Point => {
      let q = p;
      if (event.shiftKey && anchor) q = constrainAngle(anchor, q);
      if (event.altKey) return q;
      const vertices = polygon.filter((_, i) => i !== skipIndex);
      return snapPoint(q, { gridMm: snapMm, vertices, vertexReach: HANDLE_REACH_PX * 0.7 * vpRef.current.mmPerPx });
    },
    [polygon, snapMm],
  );

  const schedule = useCallback((next: PatternPieceDto) => {
    pending.current = next;
    if (frame.current !== null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      setLive(pending.current);
    });
  }, []);

  const finishDrawing = useCallback(
    (points: Point[]) => {
      const cleaned = points.filter(
        (p, i) => i === 0 || Math.hypot(p.x - points[i - 1]!.x, p.y - points[i - 1]!.y) > 0.5,
      );
      setDrawing([]);
      if (cleaned.length >= 3) onCreatePiece(cleaned);
    },
    [onCreatePiece],
  );

  // ---- pointer handling -------------------------------------------------------------------------
  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>): void => {
    wrapRef.current?.focus({ preventScroll: true });
    svgRef.current?.setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { distance: Math.hypot(a!.x - b!.x, a!.y - b!.y) };
      gesture.current = null;
      pending.current = null;
      setLive(null);
      return;
    }

    const u = vpRef.current.mmPerPx;
    const raw = toWorld(e.clientX, e.clientY);

    if (e.button === 1 || tool === 'pan' || spaceDown) {
      gesture.current = { kind: 'pan', lastX: e.clientX, lastY: e.clientY };
      setPanning(true);
      return;
    }
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    if (tool === 'draw') {
      const last = drawing[drawing.length - 1];
      const point = snap(raw, e, last);
      const first = drawing[0];
      if (first && drawing.length >= 3 && Math.hypot(point.x - first.x, point.y - first.y) <= HANDLE_REACH_PX * u) {
        finishDrawing(drawing);
      } else {
        setDrawing([...drawing, point]);
      }
      return;
    }

    if (tool === 'measure') {
      const point = snap(raw, e, ruler?.b === null ? ruler.a : undefined);
      if (!ruler || ruler.b) setRuler({ a: point, b: null });
      else setRuler({ a: ruler.a, b: point });
      return;
    }

    if (!shown || polygon.length < 3) return;

    if (tool === 'add') {
      const hit = nearestOnOutline(polygon, raw);
      if (hit && hit.distance <= EDGE_REACH_PX * u) {
        const inserted = insertPoint(polygon, notches, hit.edgeIndex, hit.t);
        onCommitPiece((p) => withOutline(p, inserted.polygon, inserted.notches));
        onSelectPoint(inserted.index);
      }
      return;
    }

    if (tool === 'remove') {
      const hit = nearestVertex(polygon, raw, HANDLE_REACH_PX * u);
      if (hit && polygon.length > 3) {
        const result = removePoint(polygon, notches, hit.index);
        onCommitPiece((p) => withOutline(p, result.polygon, result.notches));
        onSelectPoint(null);
      }
      return;
    }

    if (tool === 'notch') {
      const hit = nearestOnOutline(polygon, raw);
      if (hit && hit.distance <= EDGE_REACH_PX * u) {
        onCommitPiece((p) => withOutline(p, pieceOutline(p), toggleNotch(pieceNotches(p), hit)));
      }
      return;
    }

    if (tool === 'grain') {
      gesture.current = { kind: 'grain', origin: snap(raw, e), base: shown };
      return;
    }

    // select
    const vertex = nearestVertex(polygon, raw, HANDLE_REACH_PX * u);
    if (vertex) {
      onSelectPoint(vertex.index);
      gesture.current = { kind: 'vertex', index: vertex.index, base: shown };
    } else if (pointInPolygon(polygon, raw)) {
      onSelectPoint(null);
      gesture.current = { kind: 'body', start: raw, base: shown };
    } else {
      onSelectPoint(null);
      gesture.current = { kind: 'pan', lastX: e.clientX, lastY: e.clientY };
      setPanning(true);
    }
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>): void => {
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Two fingers: pinch to zoom + drag to pan.
    if (pinch.current && pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const distance = Math.hypot(a!.x - b!.x, a!.y - b!.y);
      if (pinch.current.distance > 0 && distance > 0) {
        const r = measureRect();
        const factor = distance / pinch.current.distance;
        setVp((v) => zoomAt(v, r.size, (a!.x + b!.x) / 2 - r.left, (a!.y + b!.y) / 2 - r.top, factor));
      }
      pinch.current = { distance };
      return;
    }

    const g = gesture.current;
    const raw = toWorld(e.clientX, e.clientY);

    if (g?.kind === 'pan') {
      const dx = e.clientX - g.lastX;
      const dy = e.clientY - g.lastY;
      gesture.current = { ...g, lastX: e.clientX, lastY: e.clientY };
      setVp((v) => panByPx(v, dx, dy));
      return;
    }

    if (g?.kind === 'vertex') {
      const poly = pieceOutline(g.base);
      const prev = poly[(g.index - 1 + poly.length) % poly.length];
      schedule(withOutline(g.base, movePoint(poly, g.index, snap(raw, e, prev, g.index))));
      return;
    }

    if (g?.kind === 'body') {
      const dx = snapMm > 0 && !e.altKey ? Math.round((raw.x - g.start.x) / snapMm) * snapMm : raw.x - g.start.x;
      const dy = snapMm > 0 && !e.altKey ? Math.round((raw.y - g.start.y) / snapMm) * snapMm : raw.y - g.start.y;
      const moved = withOutline(g.base, translatePolygon(pieceOutline(g.base), dx, dy));
      const grain = g.base.grainlineJson;
      schedule(
        grain ? { ...moved, grainlineJson: { ...grain, originX: grain.originX + dx, originY: grain.originY + dy } } : moved,
      );
      return;
    }

    if (g?.kind === 'grain') {
      const dx = raw.x - g.origin.x;
      const dy = raw.y - g.origin.y;
      if (Math.hypot(dx, dy) < 3 * vpRef.current.mmPerPx) return;
      let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      if (e.shiftKey) angle = Math.round(angle / 15) * 15;
      schedule({
        ...g.base,
        grainlineJson: { angleDegrees: Math.round(angle * 10) / 10, originX: g.origin.x, originY: g.origin.y },
      });
      return;
    }

    if (CURSOR_TOOLS.has(tool)) {
      const anchor = tool === 'draw' ? drawing[drawing.length - 1] : tool === 'measure' ? ruler?.a : undefined;
      trackCursor(tool === 'add' || tool === 'notch' ? raw : snap(raw, e, anchor));
    } else {
      trackCursor(raw);
    }
  };

  const endGesture = (e: React.PointerEvent<SVGSVGElement>): void => {
    pointers.current.delete(e.pointerId);
    svgRef.current?.releasePointerCapture?.(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    setPanning(false);

    const g = gesture.current;
    gesture.current = null;
    if (frame.current !== null) {
      cancelAnimationFrame(frame.current);
      frame.current = null;
    }
    const result = pending.current;
    pending.current = null;
    setLive(null);
    if (g && g.kind !== 'pan' && result && result !== g.base) {
      onCommitPiece(() => result);
    }
  };

  const onDoubleClick = (): void => {
    if (tool === 'draw' && drawing.length >= 3) finishDrawing(drawing);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (tool === 'draw' && drawing.length > 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        finishDrawing(drawing);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setDrawing([]);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        e.stopPropagation();
        setDrawing((d) => d.slice(0, -1));
      }
    } else if (tool === 'measure' && e.key === 'Escape' && ruler) {
      e.stopPropagation();
      setRuler(null);
    }
  };

  // ---- rendering --------------------------------------------------------------------------------
  const u = vp.mmPerPx;
  const box = viewBoxOf(vp, size);
  const grid = gridStepFor(vp);
  const grain = shown?.grainlineJson;
  const grainAngle = ((grain?.angleDegrees ?? 90) * Math.PI) / 180;
  const grainDir = { x: Math.cos(grainAngle), y: Math.sin(grainAngle) };
  const grainHalf = 70 * u;
  const bounds = polygon.length > 0 ? getBounds(polygon) : null;
  const notchMarks = getNotchMarks(polygon, notches);
  const scaleLengthMm = niceScaleLengthMm(120 * u);
  const cursorStyle =
    panning || (gesture.current?.kind === 'pan')
      ? 'grabbing'
      : tool === 'pan' || spaceDown
        ? 'grab'
        : tool === 'select'
          ? 'default'
          : tool === 'remove'
            ? 'pointer'
            : 'crosshair';

  const rulerEnd = ruler ? (ruler.b ?? cursor) : null;

  return (
    <div
      ref={wrapRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      data-testid="studio-canvas"
      className="relative flex-1 min-h-[420px] h-[min(68vh,640px)] rounded-xl border border-[#C5B190]/30 bg-[#041329] overflow-hidden select-none outline-none focus-visible:ring-2 focus-visible:ring-[#C5B190]/60 touch-none"
    >
      <svg
        ref={svgRef}
        role="application"
        aria-label="Plan de la pièce"
        data-testid="studio-svg"
        width="100%"
        height="100%"
        viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
        preserveAspectRatio="none"
        style={{ cursor: cursorStyle, display: 'block', touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endGesture}
        onPointerCancel={endGesture}
        onPointerLeave={() => trackCursor(null)}
        onDoubleClick={onDoubleClick}
      >
        {showGrid && (
          <g aria-hidden="true">
            <defs>
              <pattern id={`${uid}-minor`} width={grid.minor} height={grid.minor} patternUnits="userSpaceOnUse">
                <path d={`M ${grid.minor} 0 L 0 0 0 ${grid.minor}`} fill="none" stroke={GOLD} strokeWidth={0.6 * u} opacity="0.13" />
              </pattern>
              <pattern id={`${uid}-major`} width={grid.major} height={grid.major} patternUnits="userSpaceOnUse">
                <path d={`M ${grid.major} 0 L 0 0 0 ${grid.major}`} fill="none" stroke={GOLD} strokeWidth={1 * u} opacity="0.28" />
              </pattern>
            </defs>
            <rect x={box.x} y={box.y} width={box.w} height={box.h} fill={`url(#${uid}-minor)`} />
            <rect x={box.x} y={box.y} width={box.w} height={box.h} fill={`url(#${uid}-major)`} />
          </g>
        )}

        {shown && polygon.length >= 3 && (
          <g data-testid="studio-piece">
            {cutLine.length >= 3 && (
              <polygon
                points={toPoints(cutLine)}
                fill="#0C2650"
                fillOpacity={0.5}
                stroke={GOLD}
                strokeWidth={1.6 * u}
                strokeLinejoin="round"
                data-testid="studio-cut-line"
              />
            )}
            <polygon
              points={toPoints(polygon)}
              fill={cutLine.length >= 3 ? 'none' : '#0C2650'}
              fillOpacity={0.55}
              stroke={cutLine.length >= 3 ? '#FFFFFF' : GOLD}
              strokeOpacity={cutLine.length >= 3 ? 0.8 : 1}
              strokeWidth={cutLine.length >= 3 ? 1.1 * u : 1.8 * u}
              strokeDasharray={cutLine.length >= 3 ? `${5 * u} ${3 * u}` : undefined}
              strokeLinejoin="round"
              data-testid="studio-sew-line"
            />

            {highlightEdge !== null && edges[highlightEdge] && (
              <line
                x1={edges[highlightEdge].from.x}
                y1={edges[highlightEdge].from.y}
                x2={edges[highlightEdge].to.x}
                y2={edges[highlightEdge].to.y}
                stroke="#FFFFFF"
                strokeWidth={3.5 * u}
                strokeLinecap="round"
                opacity="0.9"
              />
            )}

            {notchMarks.map((mark, i) => (
              <line
                key={`notch-${i}`}
                data-testid="studio-notch"
                x1={mark.at.x}
                y1={mark.at.y}
                x2={mark.at.x + mark.direction.x * Math.max(allowanceMm * 0.8, 9 * u)}
                y2={mark.at.y + mark.direction.y * Math.max(allowanceMm * 0.8, 9 * u)}
                stroke={BRONZE}
                strokeWidth={2.6 * u}
                strokeLinecap="round"
              />
            ))}

            {grain && (
              <g data-testid="studio-grainline" stroke={GOLD} fill={GOLD}>
                <line
                  x1={grain.originX - grainDir.x * grainHalf}
                  y1={grain.originY - grainDir.y * grainHalf}
                  x2={grain.originX + grainDir.x * grainHalf}
                  y2={grain.originY + grainDir.y * grainHalf}
                  strokeWidth={1.2 * u}
                />
                {([1, -1] as const).map((sign) => {
                  const tip = { x: grain.originX + grainDir.x * grainHalf * sign, y: grain.originY + grainDir.y * grainHalf * sign };
                  const back = { x: tip.x - grainDir.x * 9 * u * sign, y: tip.y - grainDir.y * 9 * u * sign };
                  const perp = { x: -grainDir.y * 4 * u, y: grainDir.x * 4 * u };
                  return (
                    <polygon
                      key={sign}
                      stroke="none"
                      points={toPoints([tip, { x: back.x + perp.x, y: back.y + perp.y }, { x: back.x - perp.x, y: back.y - perp.y }])}
                    />
                  );
                })}
              </g>
            )}

            {showLengths &&
              edges.map((edge) =>
                edge.lengthMm / u >= 46 ? (
                  <text
                    key={`len-${edge.index}`}
                    x={edge.midpoint.x - edge.normal.x * 14 * u}
                    y={edge.midpoint.y - edge.normal.y * 14 * u + 4 * u}
                    fill="#D8D3C8"
                    fontSize={11 * u}
                    textAnchor="middle"
                    stroke={NAVY}
                    strokeWidth={3 * u}
                    paintOrder="stroke"
                    pointerEvents="none"
                  >
                    {formatCm(edge.lengthMm)}
                  </text>
                ) : null,
              )}

            <g data-testid="studio-handles" pointerEvents="none">
              {polygon.map((p, i) => (
                <g key={`h-${i}`}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={(selectedPoint === i ? 7 : 4.6) * u}
                    fill={selectedPoint === i ? GOLD : NAVY}
                    stroke={selectedPoint === i ? '#FFFFFF' : GOLD}
                    strokeWidth={1.6 * u}
                  />
                  {polygon.length <= 48 && 28 * u < Math.min(edges[i]?.lengthMm ?? 0, edges[(i - 1 + edges.length) % edges.length]?.lengthMm ?? 0) && (
                    <text x={p.x + 8 * u} y={p.y - 8 * u} fill={GOLD} fontSize={10 * u} opacity="0.8">
                      {i + 1}
                    </text>
                  )}
                </g>
              ))}
            </g>
          </g>
        )}

        {drawing.length > 0 && (
          <g data-testid="studio-drawing" pointerEvents="none">
            <polyline points={toPoints(cursor ? [...drawing, cursor] : drawing)} fill="none" stroke="#FFFFFF" strokeWidth={1.6 * u} strokeDasharray={`${6 * u} ${4 * u}`} />
            {drawing.length >= 3 && <polygon points={toPoints(drawing)} fill={GOLD} fillOpacity={0.12} />}
            {drawing.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={(i === 0 ? 7 : 4.5) * u} fill={i === 0 ? GOLD : NAVY} stroke={GOLD} strokeWidth={1.6 * u} />
            ))}
          </g>
        )}

        {ruler && rulerEnd && (
          <g data-testid="studio-ruler" pointerEvents="none" stroke="#7FD6C2" fill="#7FD6C2">
            <line x1={ruler.a.x} y1={ruler.a.y} x2={rulerEnd.x} y2={rulerEnd.y} strokeWidth={1.6 * u} />
            <circle cx={ruler.a.x} cy={ruler.a.y} r={4 * u} stroke="none" />
            <circle cx={rulerEnd.x} cy={rulerEnd.y} r={4 * u} stroke="none" />
            <text
              x={(ruler.a.x + rulerEnd.x) / 2}
              y={(ruler.a.y + rulerEnd.y) / 2 - 8 * u}
              fontSize={12 * u}
              textAnchor="middle"
              stroke={NAVY}
              strokeWidth={3.5 * u}
              paintOrder="stroke"
              fontWeight={700}
            >
              {formatCm(Math.hypot(rulerEnd.x - ruler.a.x, rulerEnd.y - ruler.a.y))}
            </text>
          </g>
        )}

        {cursor && CURSOR_TOOLS.has(tool) && (
          <circle cx={cursor.x} cy={cursor.y} r={5 * u} fill="none" stroke="#FFFFFF" strokeWidth={1.2 * u} opacity="0.8" pointerEvents="none" />
        )}
      </svg>

      <div className="pointer-events-none absolute left-3 bottom-3 flex items-end gap-3 text-[11px] text-[#D8D3C8]">
        <div>
          <div className="h-1.5 border-x border-b border-[#C5B190]" style={{ width: scaleLengthMm / u }} />
          <span className="font-mono">{formatCm(scaleLengthMm)}</span>
        </div>
      </div>
      <div
        className="pointer-events-none absolute right-3 bottom-3 rounded-md bg-[#041329]/80 px-2 py-1 font-mono text-[11px] text-[#C5B190]"
        data-testid="studio-readout"
      >
        {cursor ? `x ${(cursor.x / 10).toFixed(1)} · y ${(cursor.y / 10).toFixed(1)} cm · ` : ''}
        {zoomPercent(vp)} %
        {bounds ? ` · ${formatCm(bounds.width)} × ${formatCm(bounds.height)}` : ''}
      </div>
    </div>
  );
};
