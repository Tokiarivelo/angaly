export type WizardStep = 1 | 2 | 3;

export interface InspirationPhotoEntry {
  id: string;
  fileName: string;
  previewUrl: string;
  status: 'uploading' | 'done' | 'error';
  mediaId?: string;
}
