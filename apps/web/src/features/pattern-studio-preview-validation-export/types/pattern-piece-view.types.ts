import type { PatternPieceDto } from '@angaly/types';

export type CanvasViewMode = 'technical' | 'simplified';

/** Which preview fills the central area of the validation page ('studio' = the editable drawing board). */
export type PreviewMode = 'piece' | 'overview' | '3d' | 'studio';

/** What is shown next to (or over) the main view for comparison. */
export type CompareMode = 'none' | 'inspiration' | '3d';

export interface PatternPieceViewModel {
  piece: PatternPieceDto;
  zoomLevel: number;
  viewMode: CanvasViewMode;
}
