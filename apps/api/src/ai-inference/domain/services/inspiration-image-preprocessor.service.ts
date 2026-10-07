export const INSPIRATION_IMAGE_PREPROCESSOR = Symbol('IInspirationImagePreprocessor');

export interface DownscaledInspirationImage {
  buffer: Buffer;
  mimeType: string;
  width: number;
  height: number;
}

/** Port: gets the photo and shrinks it so a vision call costs ~1k tokens instead of a full-size image. */
export interface IInspirationImagePreprocessor {
  /** Downloads the original bytes (size-capped, timeout) — rejects anything that is not an image. */
  fetchOriginal(url: string): Promise<Buffer>;
  /** Auto-rotates (EXIF), caps the longest side and re-encodes (flattened on white, metadata stripped). */
  downscale(original: Buffer): Promise<DownscaledInspirationImage>;
}
