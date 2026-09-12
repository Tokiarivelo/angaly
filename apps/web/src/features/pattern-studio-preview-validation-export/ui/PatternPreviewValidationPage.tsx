'use client';

import React, { useMemo } from 'react';
import { usePatternVersion } from '../hooks/usePatternVersion';
import { usePatternPieceSelection } from '../hooks/usePatternPieceSelection';
import { useRequestReview } from '../hooks/useRequestReview';
import { ProjectStatusHeader } from './ProjectStatusHeader';
import { ReviewStatusTimeline } from './ReviewStatusTimeline';
import { CorrectionNoteCard } from './CorrectionNoteCard';
import { PatternPiecesSidebar } from './PatternPiecesSidebar';
import { PatternPieceCanvas } from './PatternPieceCanvas';
import { PatternPieceDetailsPanel } from './PatternPieceDetailsPanel';
import { ValidationActionBar } from './ValidationActionBar';
import { ExportPanel } from './ExportPanel';
import { VersionHistoryDrawer } from './VersionHistoryDrawer';
import { PatternStatus } from '@angaly/types';
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
  const { data: project, isLoading } = usePatternVersion(projectId);

  const currentVersion =
    project?.currentVersion ??
    (project?.versions && project.versions.length > 0
      ? project.versions[project.versions.length - 1]
      : null);

  const pieces = useMemo(() => {
    if (currentVersion?.pieces && currentVersion.pieces.length > 0) {
      return currentVersion.pieces;
    }
    return DEFAULT_FALLBACK_PIECES;
  }, [currentVersion]);

  const {
    selectedPieceId,
    setSelectedPieceId,
    zoomLevel,
    viewMode,
    isHistoryDrawerOpen,
    setIsHistoryDrawerOpen,
    zoomIn,
    zoomOut,
    resetZoom,
    toggleViewMode,
  } = usePatternPieceSelection(pieces[0]?.id ?? null);

  const activePieceId = selectedPieceId ?? pieces[0]?.id ?? null;
  const activePiece = pieces.find((p) => p.id === activePieceId) ?? pieces[0] ?? null;

  const { mutate: requestReviewMutate, isPending: isRequestingReview } =
    useRequestReview(projectId);

  const status = project?.status ?? PatternStatus.GENERATED;
  const projectRef = project?.projectRef ?? `ANG-PAT-${projectId.slice(0, 5).toUpperCase()}`;

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

        {status === PatternStatus.CORRECTION_REQUIRED && (
          <CorrectionNoteCard
            projectId={projectId}
            note={currentVersion?.reviewNote}
          />
        )}

        {/* 3 Columns Layout: Pieces List | SVG Canvas | Details Panel */}
        <div className="flex flex-col lg:flex-row items-stretch gap-6">
          <PatternPiecesSidebar
            pieces={pieces}
            selectedPieceId={activePieceId}
            onSelectPiece={(id) => setSelectedPieceId(id)}
          />

          <PatternPieceCanvas
            piece={activePiece}
            zoomLevel={zoomLevel}
            viewMode={viewMode}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onResetZoom={resetZoom}
            onToggleViewMode={toggleViewMode}
          />

          <PatternPieceDetailsPanel piece={activePiece} />
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
