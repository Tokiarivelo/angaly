'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Check, Loader2, RotateCcw, Save } from 'lucide-react';
import type { PatternPieceDto } from '@angaly/types';
import type { usePatternDraft } from '../../hooks/usePatternDraft';
import { useSaveDraft } from '../../hooks/useSaveDraft';
import { useRegeneratePattern } from '../../hooks/useRegeneratePattern';
import {
  createDraftPiece,
  duplicatePiece,
  movePoint,
  pieceNotches,
  pieceOutline,
  removePoint,
  translatePolygon,
  withOutline,
} from '../../utils/pattern-editing';
import type { Point } from '../../utils/pattern-geometry';
import { StudioCanvas } from './StudioCanvas';
import { StudioToolbar } from './StudioToolbar';
import { StudioInspector } from './StudioInspector';
import { StudioMeasurementsPanel } from './StudioMeasurementsPanel';
import { STUDIO_TOOLS, TOOL_BY_SHORTCUT, type StudioTool } from './studio.types';

type PatternDraft = ReturnType<typeof usePatternDraft>;

interface PatternStudioEditorProps {
  projectId: string;
  /** Version the edits are based on; null when only placeholder pieces exist (nothing to save onto). */
  versionId: string | null;
  garmentType: string;
  measurements: Record<string, number> | null;
  draft: PatternDraft;
  activePieceId: string | null;
  onSelectPiece: (id: string) => void;
}

const isTypingTarget = (target: EventTarget | null): boolean =>
  target instanceof HTMLInputElement ||
  target instanceof HTMLTextAreaElement ||
  target instanceof HTMLSelectElement;

export const PatternStudioEditor: React.FC<PatternStudioEditorProps> = ({
  projectId,
  versionId,
  garmentType,
  measurements,
  draft,
  activePieceId,
  onSelectPiece,
}) => {
  const [tool, setTool] = useState<StudioTool>('select');
  const [snapMm, setSnapMm] = useState(5);
  const [showGrid, setShowGrid] = useState(true);
  const [showLengths, setShowLengths] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const [highlightEdge, setHighlightEdge] = useState<number | null>(null);
  const [fitRequest, setFitRequest] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [tab, setTab] = useState<'piece' | 'body'>('piece');
  const [label, setLabel] = useState('');
  const save = useSaveDraft(projectId, versionId, draft);
  const { message, setMessage } = save;
  const regenerate = useRegeneratePattern(projectId);

  const { pieces, commit } = draft;
  const piece = useMemo(() => pieces.find((p) => p.id === activePieceId) ?? pieces[0] ?? null, [pieces, activePieceId]);
  const pieceId = piece?.id ?? null;

  const commitPiece = useCallback(
    (fn: (p: PatternPieceDto) => PatternPieceDto) => {
      if (!pieceId) return;
      setMessage(null);
      commit((all) => all.map((p) => (p.id === pieceId ? fn(p) : p)));
    },
    [commit, pieceId, setMessage],
  );

  const selectPoint = useCallback((index: number | null) => setSelectedPoint(index), []);

  const createPiece = useCallback(
    (polygon: Point[]) => {
      const created = createDraftPiece(polygon, `Pièce ${pieces.length + 1}`, piece?.versionId ?? versionId ?? 'draft');
      setMessage(null);
      commit((all) => [...all, created]);
      onSelectPiece(created.id);
      setSelectedPoint(null);
      setTool('select');
    },
    [commit, onSelectPiece, piece?.versionId, pieces.length, versionId, setMessage],
  );

  const duplicate = useCallback(() => {
    if (!piece) return;
    const copy = duplicatePiece(piece, `${piece.name} (copie)`);
    commit((all) => [...all, copy]);
    onSelectPiece(copy.id);
    setSelectedPoint(null);
  }, [commit, onSelectPiece, piece]);

  const remove = useCallback(() => {
    if (!piece || pieces.length <= 1) return;
    const index = pieces.findIndex((p) => p.id === piece.id);
    const fallback = pieces[index === 0 ? 1 : index - 1];
    commit((all) => all.filter((p) => p.id !== piece.id));
    if (fallback) onSelectPiece(fallback.id);
    setSelectedPoint(null);
  }, [commit, onSelectPiece, piece, pieces]);

  const handleSave = useCallback(() => save.submit(label, () => setLabel('')), [label, save]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'z') {
      if (isTypingTarget(e.target)) return;
      e.preventDefault();
      if (e.shiftKey) draft.redo();
      else draft.undo();
      return;
    }
    if (mod && e.key.toLowerCase() === 'y') {
      if (isTypingTarget(e.target)) return;
      e.preventDefault();
      draft.redo();
      return;
    }
    if (mod && e.key.toLowerCase() === 's') {
      e.preventDefault();
      handleSave();
      return;
    }
    if (isTypingTarget(e.target) || mod || e.altKey) return;

    if (e.key === 'Escape') {
      setTool('select');
      setSelectedPoint(null);
      return;
    }
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedPoint !== null && piece) {
      e.preventDefault();
      if (pieceOutline(piece).length > 3) {
        commitPiece((p) => {
          const result = removePoint(pieceOutline(p), pieceNotches(p), selectedPoint);
          return withOutline(p, result.polygon, result.notches);
        });
        setSelectedPoint(null);
      }
      return;
    }
    if (e.key.startsWith('Arrow') && piece) {
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
      const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
      commitPiece((p) => {
        const poly = pieceOutline(p);
        if (selectedPoint !== null && poly[selectedPoint]) {
          const v = poly[selectedPoint];
          return withOutline(p, movePoint(poly, selectedPoint, { x: v.x + dx, y: v.y + dy }));
        }
        const moved = withOutline(p, translatePolygon(poly, dx, dy));
        const g = p.grainlineJson;
        return g ? { ...moved, grainlineJson: { ...g, originX: g.originX + dx, originY: g.originY + dy } } : moved;
      });
      return;
    }
    if (e.key.toLowerCase() === 'f') {
      setFitRequest((n) => n + 1);
      return;
    }
    const next = TOOL_BY_SHORTCUT[e.key.toLowerCase()];
    if (next) setTool(next);
  };

  const activeTool = STUDIO_TOOLS.find((t) => t.id === tool);

  return (
    <div onKeyDown={onKeyDown} data-testid="pattern-studio-editor" className="@container min-w-0 flex-1">
    <div className="flex flex-col gap-3 @3xl:flex-row">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <StudioToolbar
          tool={tool}
          onToolChange={setTool}
          canUndo={draft.canUndo}
          canRedo={draft.canRedo}
          onUndo={draft.undo}
          onRedo={draft.redo}
          snapMm={snapMm}
          onSnapChange={setSnapMm}
          showGrid={showGrid}
          onToggleGrid={() => setShowGrid((v) => !v)}
          showLengths={showLengths}
          onToggleLengths={() => setShowLengths((v) => !v)}
          onFit={() => setFitRequest((n) => n + 1)}
          zoomPercent={zoom}
        />

        <StudioCanvas
          piece={piece}
          tool={tool}
          snapMm={snapMm}
          showGrid={showGrid}
          showLengths={showLengths}
          selectedPoint={selectedPoint}
          highlightEdge={highlightEdge}
          fitRequest={fitRequest}
          onSelectPoint={selectPoint}
          onCommitPiece={commitPiece}
          onCreatePiece={createPiece}
          onZoomChange={setZoom}
        />

        <p className="min-h-4 text-[11px] text-[#D8D3C8]/70" data-testid="studio-hint">
          <span className="font-semibold text-[#C5B190]">{activeTool?.label} :</span> {activeTool?.hint}
        </p>
      </div>

      <aside className="flex w-full shrink-0 flex-col gap-3 rounded-xl border border-[#C5B190]/20 bg-[#0C2650] p-4 @3xl:w-72">
        <div role="tablist" aria-label="Réglages" className="grid grid-cols-2 gap-1 rounded-lg bg-[#041329] p-1 text-xs">
          {([['piece', 'Pièce'], ['body', 'Mesures du corps']] as const).map(([id, text]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`rounded-md px-2 py-1.5 transition-colors ${tab === id ? 'bg-[#C5B190] font-semibold text-[#041329]' : 'text-[#D8D3C8] hover:text-white'}`}
            >
              {text}
            </button>
          ))}
        </div>

        {tab === 'piece' && piece && (
          <StudioInspector
            piece={piece}
            selectedPoint={selectedPoint}
            onSelectEdge={setHighlightEdge}
            onCommit={commitPiece}
            onDuplicate={duplicate}
            onDelete={remove}
            canDelete={pieces.length > 1}
          />
        )}
        {tab === 'piece' && !piece && (
          <p className="text-xs text-[#D8D3C8]">Aucune pièce : utilisez l’outil « Dessiner une pièce ».</p>
        )}
        {tab === 'body' && (
          <StudioMeasurementsPanel
            garmentType={garmentType}
            measurements={measurements}
            isRegenerating={regenerate.isPending}
            hasUnsavedEdits={draft.dirty}
            onRegenerate={(m) =>
              regenerate.mutate(m, {
                onSuccess: () => {
                  draft.reset();
                  setMessage({ kind: 'ok', text: 'Patron régénéré avec les nouvelles mesures.' });
                },
                onError: () => setMessage({ kind: 'error', text: 'Régénération impossible. Vérifiez les mesures.' }),
              })
            }
          />
        )}

        <div className="mt-auto flex flex-col gap-2 border-t border-[#C5B190]/20 pt-3">
          <input
            aria-label="Note de version"
            placeholder="Note de version (facultatif)"
            value={label}
            maxLength={120}
            onChange={(e) => setLabel(e.target.value)}
            className="rounded-md border border-[#C5B190]/25 bg-[#041329] px-2 py-1.5 text-xs text-white outline-none placeholder:text-[#D8D3C8]/40 focus:border-[#C5B190]"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={!draft.dirty || !versionId || save.isPending}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#C5B190] px-3 py-2 text-xs font-semibold text-[#041329] transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            >
              {save.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Save className="h-3.5 w-3.5" aria-hidden="true" />}
              Enregistrer une version
            </button>
            <button
              type="button"
              aria-label="Abandonner les retouches"
              title="Abandonner les retouches"
              onClick={() => {
                draft.reset();
                setSelectedPoint(null);
                setMessage(null);
              }}
              disabled={!draft.dirty}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#C5B190]/30 text-[#D8D3C8] hover:text-white disabled:opacity-35"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          {draft.dirty && !save.isPending && (
            <p className="text-[11px] text-[#C5B190]">Retouches non enregistrées — visibles aussi en 3D.</p>
          )}
          {message && (
            <p
              role={message.kind === 'error' ? 'alert' : 'status'}
              className={`flex items-center gap-1.5 text-[11px] ${message.kind === 'error' ? 'text-[#F0B3AD]' : 'text-[#9CD0B1]'}`}
            >
              {message.kind === 'ok' && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
              {message.text}
            </p>
          )}
        </div>
      </aside>
    </div>
    </div>
  );
};
