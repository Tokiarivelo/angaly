'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Hand, Maximize2, Minimize2, Pause, Play, RotateCcw } from 'lucide-react';
import type { MeshEditProps, ScreenRect, ViewName, ViewRequest } from './Garment3DViewer';
import type { FabricLook } from './fabricTextures';
import { WebGlBoundary } from './WebGlBoundary';
import { RealisticRenderSection } from './RealisticRenderSection';
import type { PatternPieceDto, Trim } from '@angaly/types';
import type { FitStatus } from '../utils/garment3d/garment-model';
import { buildGarmentModelCached } from '../utils/garment3d/model-cache';
import type { usePatternDraft } from '../hooks/usePatternDraft';
import { usePatternSculpt, type PatternSculpt } from '../hooks/usePatternSculpt';
import { useSaveDraft } from '../hooks/useSaveDraft';
import { SculptToolbar, TOOL_BY_KEY, type ModelingMode } from './SculptToolbar';
import { MeshEditToolbar } from './MeshEditToolbar';
import { useMeshEdit, type TransformKind } from '../hooks/useMeshEdit';
import { resolveSelection, selectionMedian, type PointInstance } from '../utils/garment3d/mesh-edit';
import type { SculptViewProps } from './SculptBrush';
import { BODY_TEMPLATES, suggestTemplate, type BodyTemplateId } from '../utils/garment3d/body-templates';
import {
  JOINT_LIMITS,
  NEUTRAL_POSE,
  POSE_PRESETS,
  type BodyPose,
  type JointName,
  type LimbName,
  type PosePresetId,
} from '../utils/garment3d/pose';

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
  /** Modelling the pattern on the garment (absent: view only). */
  editing?: Garment3DEditing | null | undefined;
  /** Garnitures of the generated version (colours of the lace, bead rows): drawn on the garment. */
  trims?: Trim[] | null | undefined;
  /**
   * The inspiration photo is laid over the 3D: the view turns to the front, and the garment's box on the screen is
   * reported as it moves (the photo follows it).
   */
  onGarmentScreenRect?: ((rect: ScreenRect | null) => void) | undefined;
}

export interface Garment3DEditing {
  draft: ReturnType<typeof usePatternDraft>;
  projectId: string;
  /** Version the edits are saved onto (null: placeholder pieces, nothing to save onto). */
  versionId: string | null;
  onSelectPiece?: ((id: string) => void) | undefined;
}

/** The modelling bar, with the draft's save (one hook per mounted bar). */
const SculptBar: React.FC<{
  sculpt: PatternSculpt;
  editing: Garment3DEditing;
  mode: ModelingMode;
  onModeChange: (mode: ModelingMode) => void;
  editOptions: React.ReactNode;
}> = ({ sculpt, editing, mode, onModeChange, editOptions }) => {
  const { draft } = editing;
  const save = useSaveDraft(editing.projectId, editing.versionId, draft);
  return (
    <SculptToolbar
      mode={mode}
      onModeChange={onModeChange}
      editOptions={editOptions}
      tool={sculpt.settings.tool}
      onToolChange={sculpt.setTool}
      radiusMm={sculpt.settings.radiusMm}
      onRadiusChange={sculpt.setRadius}
      falloff={sculpt.settings.falloff}
      onFalloffChange={sculpt.setFalloff}
      propagate={sculpt.propagate}
      onPropagateChange={sculpt.setPropagate}
      blocked={sculpt.blocked}
      canUndo={draft.canUndo}
      canRedo={draft.canRedo}
      onUndo={draft.undo}
      onRedo={draft.redo}
      dirty={draft.dirty}
      onDiscard={() => {
        draft.reset();
        save.setMessage(null);
      }}
      canSave={save.canSave}
      isSaving={save.isPending}
      onSave={() => save.submit()}
      message={save.message}
    />
  );
};

const STATUS_LABELS: Record<FitStatus, { label: string; className: string }> = {
  tight: { label: 'Trop serré', className: 'bg-[#A64A43]/20 text-[#F0B3AD] border-[#A64A43]/50' },
  fitted: { label: 'Ajusté', className: 'bg-[#C5B190]/15 text-[#C5B190] border-[#C5B190]/40' },
  comfortable: { label: 'Confortable', className: 'bg-[#46745A]/20 text-[#9CD0B1] border-[#46745A]/50' },
  loose: { label: 'Ample', className: 'bg-[#7F95B8]/20 text-[#BCCBE6] border-[#7F95B8]/50' },
};

const ANIMATION_MS = 2400;

const LIMBS: Array<{ id: LimbName; label: string; kind: 'arm' | 'leg' }> = [
  { id: 'leftArm', label: 'Bras gauche', kind: 'arm' },
  { id: 'rightArm', label: 'Bras droit', kind: 'arm' },
  { id: 'leftLeg', label: 'Jambe gauche', kind: 'leg' },
  { id: 'rightLeg', label: 'Jambe droite', kind: 'leg' },
];

const JOINT_LABELS: Record<'arm' | 'leg', Array<[JointName, string]>> = {
  arm: [
    ['raise', 'Écarter'],
    ['forward', 'Lever devant'],
    ['twist', 'Rotation'],
    ['bend', 'Coude'],
  ],
  leg: [
    ['raise', 'Écarter'],
    ['forward', 'Lever devant'],
    ['bend', 'Genou'],
  ],
};

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

export const Garment3DPanel: React.FC<Garment3DPanelProps> = ({
  pieces,
  garmentType,
  measurements,
  selectedPieceId,
  fabric,
  editing,
  trims,
  onGarmentScreenRect,
}) => {
  const sculpt = usePatternSculpt(editing?.draft);
  const meshEdit = useMeshEdit(editing?.draft);
  const [mode, setModeState] = useState<ModelingMode>('view');
  // The pattern's points as placed on the garment by the viewer (after every drape).
  const [instances, setInstances] = useState<PointInstance[]>([]);
  const { setActive: setSculptActive } = sculpt;
  const { cancel: cancelTransform } = meshEdit;
  const setMode = useCallback(
    (next: ModelingMode) => {
      cancelTransform();
      setModeState(next);
      setSculptActive(next === 'sculpt');
    },
    [cancelTransform, setSculptActive],
  );
  const onSelectPiece = editing?.onSelectPiece;
  const editView = useMemo<MeshEditProps | null>(
    () =>
      mode === 'edit' && editing
        ? {
            pieces,
            selection: meshEdit.selection,
            modal: meshEdit.modal,
            xray: meshEdit.xray,
            proportional: meshEdit.proportional.enabled,
            onSelect: (key, panelId, extend) => {
              meshEdit.select(key, panelId, extend);
              if (key) onSelectPiece?.(key.slice(0, key.lastIndexOf('#')));
            },
            onBoxSelect: (entries, extend) => {
              meshEdit.selectMany(entries, extend);
              const first = entries[0];
              if (first) onSelectPiece?.(first.key.slice(0, first.key.lastIndexOf('#')));
            },
            onInsert: meshEdit.insertAt,
            onTransform: meshEdit.apply,
            onConfirm: meshEdit.confirm,
            onCancel: meshEdit.cancel,
            onRadiusScale: (f) => meshEdit.setProportionalRadius(meshEdit.proportional.radiusMm * f),
            onInstances: setInstances,
          }
        : null,
    [mode, editing, pieces, meshEdit, onSelectPiece],
  );
  const startTransform = (kind: TransformKind): void => {
    meshEdit.startTransform(kind, instances);
  };
  const selected = useMemo(() => resolveSelection(instances, meshEdit.selection), [instances, meshEdit.selection]);
  const editOptions =
    mode === 'edit' && editing ? (
      <MeshEditToolbar
        selectedCount={meshEdit.selection.size}
        selectedPieces={[...new Set(selected.map((s) => s.pieceId))].map((id) => editing.draft.pieces.find((p) => p.id === id)?.name ?? id)}
        median={selectionMedian(editing.draft.pieces, selected)}
        onMedianChange={(target) => meshEdit.moveMedianTo(instances, target)}
        modal={meshEdit.modal}
        onTransform={startTransform}
        onSelectAll={() => meshEdit.toggleAll(instances)}
        onSelectLinked={() => meshEdit.selectLinked(instances)}
        onDelete={meshEdit.deleteSelected}
        onSubdivide={meshEdit.subdivideSelected}
        proportional={meshEdit.proportional}
        onToggleProportional={meshEdit.toggleProportional}
        onProportionalRadius={meshEdit.setProportionalRadius}
        onProportionalFalloff={meshEdit.setProportionalFalloff}
        xray={meshEdit.xray}
        onXrayChange={meshEdit.setXray}
      />
    ) : null;
  const modalRef = useRef(meshEdit.modal);
  modalRef.current = meshEdit.modal;
  const sculptView = useMemo<SculptViewProps | null>(
    () =>
      sculpt.active
        ? {
            radiusMm: sculpt.settings.radiusMm,
            falloff: sculpt.settings.falloff,
            propagate: sculpt.propagate,
            onStart: sculpt.start,
            onMove: sculpt.move,
            onEnd: sculpt.end,
            onPick: editing?.onSelectPiece,
          }
        : null,
    [sculpt, editing?.onSelectPiece],
  );
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
  // Joints of the mannequin: a ready-made pose, then each joint on its own slider.
  // A fabric shown as a photograph (known surface) starts in the fashion-plate pose, arms relaxed by the body.
  const initialPreset: PosePresetId = fabric?.fabricFinish ? 'PRESENTATION' : 'NEUTRE';
  const [pose, setPose] = useState<BodyPose>(() => (initialPreset === 'NEUTRE' ? NEUTRAL_POSE : POSE_PRESETS[initialPreset].pose));
  const [presetId, setPresetId] = useState<PosePresetId | 'CUSTOM'>(initialPreset);
  const [showJoints, setShowJoints] = useState(false);
  const setJoint = (limb: LimbName, joint: JointName, value: number): void => {
    setPose((p) => ({ ...p, [limb]: { ...p[limb], [joint]: value } }));
    setPresetId('CUSTOM');
  };

  const result = useMemo(
    () => buildGarmentModelCached(pieces, garmentType, measurements, templateId, fabric?.fabricBehavior, trims),
    [pieces, garmentType, measurements, templateId, fabric?.fabricBehavior, trims],
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
      // Escape first cancels a transform in progress (edit mode).
      if (event.key === 'Escape' && !modalRef.current) setFullscreen(false);
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
  // A photo laid over the 3D is a front view: the garment turns to face it.
  const overlaid = Boolean(onGarmentScreenRect);
  useEffect(() => {
    if (overlaid) setViewRequest((previous) => ({ view: 'front', nonce: (previous?.nonce ?? 0) + 1 }));
  }, [overlaid]);

  // Blender numpad habits: 1 front, Ctrl+1 / 9 back, 3 side, 7 top, Home or 5 reset.
  /** Blender's edit-mode keys; true when the key was used. */
  const handleEditKey = (event: React.KeyboardEvent<HTMLDivElement>): boolean => {
    const key = event.key.toLowerCase();
    const mod = event.ctrlKey || event.metaKey;
    if (meshEdit.modal) {
      if (key === 'x' || key === 'y' || key === 'z') meshEdit.setAxis(key);
      else if (event.key === 'Enter') meshEdit.confirm();
      else if (event.key === 'Escape') meshEdit.cancel();
      else if (/^[0-9.-]$/.test(event.key) || event.key === 'Backspace') meshEdit.typeKey(event.key);
      else if (key === 'g' || key === 's' || key === 'r') return true;
      else return false;
      return true;
    }
    if (mod && key === 'l') meshEdit.selectLinked(instances);
    else if (mod) return false;
    else if (event.altKey && key === 'a') meshEdit.deselectAll();
    else if (event.altKey && key === 'z') meshEdit.setXray(!meshEdit.xray);
    else if (event.altKey) return false;
    else if (key === 'g') startTransform('grab');
    else if (key === 's') startTransform('scale');
    else if (key === 'r') startTransform('rotate');
    else if (key === 'a') meshEdit.toggleAll(instances);
    else if (key === 'x' || event.key === 'Delete') meshEdit.deleteSelected();
    else if (key === 'o') meshEdit.toggleProportional();
    else return false;
    return true;
  };

  const handleStageKey = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    const mod = event.ctrlKey || event.metaKey;
    if (editing && event.key === 'Tab' && !mod && !event.altKey) {
      event.preventDefault();
      setMode(mode === 'edit' ? 'view' : 'edit');
      return;
    }
    if (mode === 'edit' && editing && handleEditKey(event)) {
      event.preventDefault();
      return;
    }
    if (editing && mod && (event.key.toLowerCase() === 'z' || event.key.toLowerCase() === 'y')) {
      event.preventDefault();
      if (event.key.toLowerCase() === 'y' || event.shiftKey) editing.draft.redo();
      else editing.draft.undo();
      return;
    }
    if (sculpt.active && !mod && !event.altKey) {
      const tool = TOOL_BY_KEY[event.key.toLowerCase()];
      if (tool) {
        event.preventDefault();
        sculpt.setTool(tool);
        return;
      }
      if (event.key === '[' || event.key === ']') {
        event.preventDefault();
        sculpt.setRadius(sculpt.settings.radiusMm * (event.key === ']' ? 1.2 : 1 / 1.2));
        return;
      }
    }
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
            pose={pose}
            sculpt={sculptView}
            edit={editView}
            onGarmentScreenRect={onGarmentScreenRect}
          />
        </WebGlBoundary>
        <p className="pointer-events-none absolute bottom-2 left-3 text-[11px] text-[#D8D3C8]/60">
          {mode === 'edit'
            ? 'Clic : point · glisser : rectangle · Alt + glisser ou clic molette : tourner · clic droit : déplacer · molette : zoomer'
            : sculpt.active
            ? 'Glisser sur le tissu : modeler · ailleurs : tourner · clic droit : déplacer · molette : zoomer'
            : 'Glisser : tourner · outil Main, Maj + glisser ou clic droit : déplacer · molette : zoomer'}
        </p>
      </div>

      {editing && <SculptBar sculpt={sculpt} editing={editing} mode={mode} onModeChange={setMode} editOptions={editOptions} />}

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
          <span className="whitespace-nowrap">Pose</span>
          <select
            aria-label="Pose du mannequin"
            value={presetId}
            onChange={(e) => {
              const id = e.target.value as PosePresetId | 'CUSTOM';
              setPresetId(id);
              if (id !== 'CUSTOM') setPose(POSE_PRESETS[id].pose);
            }}
            className="bg-[#0C2650] border border-[#C5B190]/30 text-[#D8D3C8] text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#C5B190]"
          >
            {(Object.keys(POSE_PRESETS) as PosePresetId[]).map((id) => (
              <option key={id} value={id}>
                {POSE_PRESETS[id].label}
              </option>
            ))}
            {presetId === 'CUSTOM' && <option value="CUSTOM">Personnalisée</option>}
          </select>
        </label>
        <button
          type="button"
          aria-expanded={showJoints}
          onClick={() => setShowJoints((v) => !v)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${
            showJoints
              ? 'bg-[#C5B190] text-[#041329] border-[#C5B190]'
              : 'bg-[#0C2650] border-[#C5B190]/30 text-[#C5B190] hover:border-[#C5B190]'
          }`}
        >
          Articulations
        </button>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={showMannequin} onChange={(e) => setShowMannequin(e.target.checked)} />
          Mannequin
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={transparent} onChange={(e) => setTransparent(e.target.checked)} />
          Transparence
        </label>
      </div>

      {showJoints && (
        <div data-testid="pose-joints" className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#D8D3C8]">
          {LIMBS.map((limb) => (
            <fieldset key={limb.id} className="rounded-lg bg-[#0C2650] border border-[#C5B190]/20 p-3">
              <legend className="px-1 text-[11px] uppercase tracking-wider text-[#C5B190]">{limb.label}</legend>
              {JOINT_LABELS[limb.kind].map(([joint, label]) => {
                const [min, max] = JOINT_LIMITS[limb.kind][joint];
                const value = pose[limb.id][joint];
                return (
                  <label key={joint} className="flex items-center gap-2 py-0.5">
                    <span className="w-24 whitespace-nowrap">{label}</span>
                    <input
                      type="range"
                      min={min}
                      max={max}
                      value={value}
                      aria-label={`${limb.label} — ${label}`}
                      onChange={(e) => setJoint(limb.id, joint, Number(e.target.value))}
                      className="w-full accent-[#C5B190]"
                    />
                    <span className="font-mono w-10 text-right">{value}°</span>
                  </label>
                );
              })}
            </fieldset>
          ))}
          <button
            type="button"
            onClick={() => {
              setPose(NEUTRAL_POSE);
              setPresetId('NEUTRE');
            }}
            className="sm:col-span-2 justify-self-start px-3 py-1.5 rounded-lg bg-[#0C2650] border border-[#C5B190]/30 text-[#C5B190] hover:border-[#C5B190]"
          >
            Remettre debout
          </button>
        </div>
      )}

      {editing?.versionId && (
        <RealisticRenderSection
          versionId={editing.versionId}
          model={model}
          presetId={presetId}
          fabric={fabric}
          showMannequin={showMannequin}
        />
      )}

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
        {model.inside.length > 0 && ` Pièces intérieures (non visibles) : ${model.inside.join(', ')}.`}
      </p>
    </div>
  );
};
