import type { PatternPieceDto } from '@angaly/types';

export type CanvasViewMode = 'technical' | 'simplified';

export interface PatternPieceViewModel {
  piece: PatternPieceDto;
  zoomLevel: number;
  viewMode: CanvasViewMode;
}
