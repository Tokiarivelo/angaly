export const RENDER_SOURCE_READER = Symbol('IRenderSourceReader');

export interface RenderSourcePiece {
  id: string;
  versionId: string;
  name: string;
  dimensionsJson: Record<string, unknown>;
  fabricRecommendation: string | null;
  quantity: number;
  grainlineJson: unknown;
  seamAllowanceCm: number | null;
  notchesJson: unknown;
}

/**
 * Everything the simulation needs from a pattern version, plus its owner (for access checks). What is sent to the
 * worker leaves `customerId` out: an anonymous mannequin and the pieces only (GDPR, §5 C of the feature sheet).
 */
export interface RenderSource {
  versionId: string;
  customerId: string;
  garmentType: string;
  measurements: Record<string, number> | null;
  fabricBehavior: string | null;
  /** The fabric read off the inspiration photo (`GarmentFit`: colours, print, finish). */
  fit: Record<string, unknown> | null;
  pieces: RenderSourcePiece[];
}

export interface IRenderSourceReader {
  findByVersionId(versionId: string): Promise<RenderSource | null>;
}
