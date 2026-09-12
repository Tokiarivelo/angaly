'use client';

import { useState, useCallback } from 'react';
import type { CanvasViewMode } from '../types/pattern-piece-view.types';

export const usePatternPieceSelection = (initialPieceId: string | null = null) => {
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(initialPieceId);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [viewMode, setViewMode] = useState<CanvasViewMode>('technical');
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState<boolean>(false);

  const zoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 2.5));
  }, []);

  const zoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  }, []);

  const resetZoom = useCallback(() => {
    setZoomLevel(1.0);
  }, []);

  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => (prev === 'technical' ? 'simplified' : 'technical'));
  }, []);

  return {
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
  };
};
