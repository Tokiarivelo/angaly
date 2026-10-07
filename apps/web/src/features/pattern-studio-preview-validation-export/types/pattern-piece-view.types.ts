import type { PatternPieceDto } from '@angaly/types';

export type CanvasViewMode = 'technical' | 'simplified';

/** Which preview fills the central area of the validation page. */
export type PreviewMode = 'piece' | 'overview' | '3d';

export interface PatternPieceViewModel {
  piece: PatternPieceDto;
  zoomLevel: number;
  viewMode: CanvasViewMode;
}
