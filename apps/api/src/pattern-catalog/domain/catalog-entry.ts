/**
 * A dress of the pattern catalogue (« Catalogue des patrons ») — what the engine knows how to make, with its
 * inspiration photo. Plain data: the Domain depends on nothing.
 */
export type CatalogGroup = 'MODERNE' | 'HISTORIQUE' | 'MARIEE';

/** Where the inspiration photo comes from (always a licence-tracked, public-domain museum photo). */
export interface CatalogInspirationCredit {
  title: string;
  date: string;
  source: string;
  page: string;
  license: string;
}

/** The stored inspiration photo (MinIO, via @angaly/storage), when it has been seeded. */
export interface CatalogImage {
  /** The Media row of the photo: every project started from the dress points at it (one row per stored file). */
  mediaId: string;
  bucket: string;
  objectKey: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
}

/** What a project created from the entry starts with (validated again by the patterns module on generation). */
export interface CatalogProjectTemplate {
  garmentType: string;
  cutType: string;
  details: Record<string, string>;
  parametersExt: Record<string, unknown>;
  /** Colours and cloth for the 3D preview (`GarmentFit` fields). */
  look: Record<string, string> | null;
}

export interface CatalogEntry {
  id: string;
  title: string;
  era: string;
  notes: string;
  group: CatalogGroup;
  /** Pieces and indicative yardage of the pattern at the reference measurements. */
  pieceCount: number;
  yardageM: number | null;
  /** Names of the pieces (as generated), for « Voir les pièces ». */
  pieces: Array<{ name: string; quantity: number }>;
  template: CatalogProjectTemplate;
  credit: CatalogInspirationCredit | null;
}

export const PATTERN_CATALOG_SOURCE = Symbol('IPatternCatalogSource');
export const CATALOG_IMAGE_REPOSITORY = Symbol('ICatalogImageRepository');

/** The catalogue's entries (built from the pattern engine's own catalogue). */
export interface IPatternCatalogSource {
  list(): CatalogEntry[];
  find(id: string): CatalogEntry | null;
}

/** The seeded inspiration photos, by catalogue entry id. */
export interface ICatalogImageRepository {
  findAll(): Promise<Map<string, CatalogImage>>;
}

/** altText prefix of the Media rows holding the catalogue photos (`catalog:<id> — <credit>`). */
export const CATALOG_IMAGE_PREFIX = 'catalog:';
