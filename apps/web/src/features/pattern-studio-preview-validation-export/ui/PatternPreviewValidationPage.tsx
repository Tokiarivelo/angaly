'use client';

import React, { useDeferredValue, useMemo, useState } from 'react';
import { usePatternVersion } from '../hooks/usePatternVersion';
import { usePatternPieceSelection } from '../hooks/usePatternPieceSelection';
import { usePatternDraft } from '../hooks/usePatternDraft';
import type { CompareMode } from '../types/pattern-piece-view.types';
import { useRequestReview } from '../hooks/useRequestReview';
import { useInspirationOverlay } from '../hooks/useInspirationOverlay';
import type { ScreenRect } from './Garment3DViewer';
import { ProjectStatusHeader } from './ProjectStatusHeader';
import { ReviewStatusTimeline } from './ReviewStatusTimeline';
import { CorrectionNoteCard } from './CorrectionNoteCard';
import { EstimatedMeasurementsBanner } from './EstimatedMeasurementsBanner';
import { GenerationNoticesPanel } from './GenerationNoticesPanel';
import { parseGenerationNotices } from '@/features/pattern-studio-wizard/utils/generation-notices';
import { PatternPiecesSidebar } from './PatternPiecesSidebar';
import { PatternPieceCanvas } from './PatternPieceCanvas';
import { PatternLayoutOverview } from './PatternLayoutOverview';
import { Garment3DPanel } from './Garment3DPanel';
import { PreviewModeTabs } from './PreviewModeTabs';
import { InspirationPanel } from './InspirationPanel';
import { ComparisonLayout } from './ComparisonLayout';
import { PatternStudioEditor } from './studio/PatternStudioEditor';
import { PatternPieceDetailsPanel } from './PatternPieceDetailsPanel';
import { ValidationActionBar } from './ValidationActionBar';
import { ExportPanel } from './ExportPanel';
import { VersionHistoryDrawer } from './VersionHistoryDrawer';
import { PatternStatus, validatePatternExtParameters } from '@angaly/types';
import type { PatternPieceDto } from '@angaly/types';

interface PatternPreviewValidationPageProps {
  projectId: string;
}

// Fallback pieces if no pieces exist yet on the version
const DEFAULT_FALLBACK_PIECES: PatternPieceDto[] = [
  {
    id: 'p-devant',
    versionId: 'v-1',
    name: '01. Devant (Au pli)',
    dimensionsJson: {
      widthMm: 485,
      heightMm: 620,
      outlineMm: [
        { x: 60, y: 40 },
        { x: 140, y: 40 },
        { x: 170, y: 240 },
        { x: 30, y: 240 },
      ],
    },
    fabricRecommendation: 'Soie sauvage ou lin lavé de Madagascar',
    quantity: 1,
    grainlineJson: { angleDegrees: 0, originX: 100, originY: 70 },
    seamAllowanceCm: 1.5,
    notchesJson: [{ positionAlongEdge: 0.4, edgeIndex: 3 }],
  },
  {
    id: 'p-dos',
    versionId: 'v-1',
    name: '02. Demi-Dos (×2)',
    dimensionsJson: {
      widthMm: 260,
      heightMm: 620,
      outlineMm: [
        { x: 50, y: 40 },
        { x: 130, y: 40 },
        { x: 155, y: 240 },
        { x: 50, y: 240 },
      ],
    },
    fabricRecommendation: 'Soie sauvage ou lin lavé de Madagascar',
    quantity: 2,
    grainlineJson: { angleDegrees: 0, originX: 90, originY: 70 },
    seamAllowanceCm: 1.5,
    notchesJson: [{ positionAlongEdge: 0.3, edgeIndex: 0 }],
  },
  {
    id: 'p-ceinture',
    versionId: 'v-1',
    name: '03. Ceinture thermocollée',
    dimensionsJson: {
      widthMm: 720,
      heightMm: 70,
      outlineMm: [
        { x: 25, y: 90 },
        { x: 175, y: 90 },
        { x: 175, y: 160 },
        { x: 25, y: 160 },
      ],
    },
    fabricRecommendation: 'Entoilage moyen structuré',
    quantity: 1,
    grainlineJson: { angleDegrees: 90, originX: 55, originY: 125 },
    seamAllowanceCm: 1.0,
    notchesJson: [],
  },
];

export const PatternPreviewValidationPage: React.FC<PatternPreviewValidationPageProps> = ({
  projectId,
}) => {
  const { data: project, isLoading, isError } = usePatternVersion(projectId);

  const currentVersion =
    project?.currentVersion ??
    (project?.versions && project.versions.length > 0
      ? project.versions[project.versions.length - 1]
      : null);

  const hasSavedPieces = Boolean(currentVersion?.pieces && currentVersion.pieces.length > 0);
  const savedPieces = useMemo(
    () => (hasSavedPieces && currentVersion ? currentVersion.pieces : DEFAULT_FALLBACK_PIECES),
    [hasSavedPieces, currentVersion],
  );

  // Hand edits made in the studio live here so the 2D, overview and 3D views all show them at once.
  const draft = usePatternDraft(savedPieces);
  const pieces = draft.pieces;
  // The 3D drape is the costly part: let it lag a frame behind the drawing instead of blocking it.
  const piecesFor3d = useDeferredValue(pieces);
  const [compare, setCompare] = useState<CompareMode>('none');
  const [overlay, setOverlay] = useState(false);
  const [overlayOpacity, setOverlayOpacity] = useState(0.5);

  const {
    selectedPieceId,
    setSelectedPieceId,
    zoomLevel,
    viewMode,
    previewMode,
    setPreviewMode,
    isHistoryDrawerOpen,
    setIsHistoryDrawerOpen,
    zoomIn,
    zoomOut,
    resetZoom,
    toggleViewMode,
  } = usePatternPieceSelection(savedPieces[0]?.id ?? null);

  const activePieceId = selectedPieceId ?? pieces[0]?.id ?? null;
  const activePiece = pieces.find((p) => p.id === activePieceId) ?? pieces[0] ?? null;

  const estimatedMeasurementKeys = useMemo(() => {
    const raw = currentVersion?.parametersJson?.['estimatedMeasurementKeys'];
    return Array.isArray(raw) ? (raw as string[]) : [];
  }, [currentVersion]);

  const notices = useMemo(() => parseGenerationNotices(currentVersion?.parametersJson), [currentVersion]);

  // Garnitures the version was generated with (validated again: older versions have none).
  const trims = useMemo(() => {
    const parameters = currentVersion?.parametersJson?.['parameters'];
    const raw = parameters && typeof parameters === 'object' ? (parameters as Record<string, unknown>)['trims'] : undefined;
    return validatePatternExtParameters({ trims: raw }).value.trims?.items ?? null;
  }, [currentVersion]);

  const measurements = useMemo(() => {
    const raw = currentVersion?.parametersJson?.['measurements'];
    return raw && typeof raw === 'object' ? (raw as Record<string, number>) : null;
  }, [currentVersion]);

  const { mutate: requestReviewMutate, isPending: isRequestingReview } =
    useRequestReview(projectId);

  const status = project?.status ?? PatternStatus.GENERATED;
  const projectRef = project?.projectRef ?? `ANG-PAT-${projectId.slice(0, 5).toUpperCase()}`;

  const inspirationUrl = project?.inspirationMediaUrl ?? null;
  // Comparing a view with itself, or with a missing photo, makes no sense: fall back to no comparison.
  const effectiveCompare: CompareMode =
    (compare === '3d' && previewMode === '3d') || (compare === 'inspiration' && !inspirationUrl) ? 'none' : compare;
  const overlayActive = overlay && previewMode === '3d' && effectiveCompare === 'inspiration';
  // The pattern laid over the photo: shown beside a view, or the photo laid over the 3D.
  const photoShown = effectiveCompare === 'inspiration' && Boolean(inspirationUrl);
  const fabricLook = project?.inspirationAnalysisJson?.profile?.fit;
  const inspirationOverlay = useInspirationOverlay({
    projectId,
    url: inspirationUrl,
    pieces,
    garmentType: project?.garmentType ?? 'ROBE',
    measurements,
    fabricColor: fabricLook?.fabricColor,
    fabricBehavior: fabricLook?.fabricBehavior,
    trims,
    enabled: photoShown,
  });
  const pieceNames = useMemo(() => Object.fromEntries(pieces.map((p) => [p.id, p.name])), [pieces]);
  const [garmentScreenRect, setGarmentScreenRect] = useState<ScreenRect | null>(null);

  const garment3d = (
    <Garment3DPanel
      pieces={piecesFor3d}
      garmentType={project?.garmentType ?? 'ROBE'}
      measurements={measurements}
      selectedPieceId={activePieceId}
      fabric={project?.inspirationAnalysisJson?.profile?.fit}
      trims={trims}
      onGarmentScreenRect={overlayActive ? setGarmentScreenRect : undefined}
      editing={{
        draft,
        projectId,
        versionId: hasSavedPieces ? (currentVersion?.id ?? null) : null,
        onSelectPiece: setSelectedPieceId,
      }}
    />
  );

  const primaryView =
    previewMode === 'piece' ? (
      <PatternPieceCanvas
        piece={activePiece}
        zoomLevel={zoomLevel}
        viewMode={viewMode}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onResetZoom={resetZoom}
        onToggleViewMode={toggleViewMode}
      />
    ) : previewMode === 'overview' ? (
      <PatternLayoutOverview
        pieces={pieces}
        selectedPieceId={activePieceId}
        onSelectPiece={(id) => {
          setSelectedPieceId(id);
          setPreviewMode('piece');
        }}
      />
    ) : previewMode === '3d' ? (
      garment3d
    ) : (
      <PatternStudioEditor
        projectId={projectId}
        versionId={hasSavedPieces ? (currentVersion?.id ?? null) : null}
        garmentType={project?.garmentType ?? 'ROBE'}
        measurements={measurements}
        draft={draft}
        activePieceId={activePieceId}
        onSelectPiece={setSelectedPieceId}
      />
    );

  const secondaryView =
    overlayActive || effectiveCompare === 'none' ? null : effectiveCompare === 'inspiration' ? (
      <InspirationPanel
        url={inspirationUrl}
        overlay={{ data: inspirationOverlay, selectedPieceId: activePieceId, pieceNames, onSelectPiece: setSelectedPieceId }}
      />
    ) : (
      garment3d
    );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#041329] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#C5B190] border-t-transparent animate-spin" />
          <p className="text-sm text-[#D8D3C8]">Chargement de votre atelier numérique…</p>
        </div>
      </div>
    );
  }

  // A project that cannot be read (someone else's, or gone) must say so: showing a sample pattern under the
  // project's reference would pass for the real thing.
  if (isError && !project) {
    return (
      <div className="min-h-screen bg-[#041329] text-white flex items-center justify-center px-4">
        <div role="alert" className="max-w-md rounded-xl border border-[#C5B190]/30 bg-[#0C2650] p-6 text-center">
          <h1 className="font-serif text-xl text-white">Projet de patron introuvable</h1>
          <p className="mt-2 text-sm text-[#D8D3C8]">
            Ce projet n’existe pas ou appartient à un autre compte. Connectez-vous avec le compte qui l’a créé.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#041329] text-white flex flex-col font-sans">
      <ProjectStatusHeader
        projectRef={projectRef}
        status={status}
        garmentType={project?.garmentType ?? 'Robe'}
        versionsCount={project?.versionsCount ?? project?.versions?.length ?? 1}
        onOpenHistory={() => setIsHistoryDrawerOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <ReviewStatusTimeline status={status} />

        <EstimatedMeasurementsBanner estimatedKeys={estimatedMeasurementKeys} />

        <GenerationNoticesPanel notices={notices} />

        {status === PatternStatus.CORRECTION_REQUIRED && (
          <CorrectionNoteCard
            projectId={projectId}
            note={currentVersion?.reviewNote}
          />
        )}

        <PreviewModeTabs
          mode={previewMode}
          onChange={setPreviewMode}
          inspirationUrl={inspirationUrl}
          compare={effectiveCompare}
          onCompareChange={setCompare}
          overlay={overlayActive}
          onOverlayChange={setOverlay}
          overlayOpacity={overlayOpacity}
          onOverlayOpacityChange={setOverlayOpacity}
        />

        {/* Pieces list | Preview (2D / ensemble / 3D / studio) [+ comparison] | Details panel */}
        <div className="flex flex-col lg:flex-row items-stretch gap-6">
          <PatternPiecesSidebar
            pieces={pieces}
            selectedPieceId={activePieceId}
            onSelectPiece={(id) => setSelectedPieceId(id)}
          />

          <ComparisonLayout
            primary={primaryView}
            secondary={secondaryView}
            overlay={
              overlayActive && inspirationUrl
                ? { url: inspirationUrl, opacity: overlayOpacity, photoRect: inspirationOverlay.rect, target: garmentScreenRect }
                : null
            }
          />

          {previewMode !== 'studio' && effectiveCompare === 'none' && <PatternPieceDetailsPanel piece={activePiece} />}
        </div>

        {/* Action Bar */}
        <ValidationActionBar
          projectId={projectId}
          status={status}
          isSubmittingReview={isRequestingReview}
          onRequestReview={() => requestReviewMutate()}
        />

        {/* Export Panel */}
        <ExportPanel
          projectId={projectId}
          versionId={currentVersion?.id ?? 'v-active'}
          status={status}
        />
      </main>

      {/* Version History Drawer */}
      <VersionHistoryDrawer
        projectId={projectId}
        currentVersionId={currentVersion?.id}
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
      />
    </div>
  );
};
