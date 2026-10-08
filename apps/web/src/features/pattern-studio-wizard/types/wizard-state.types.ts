import type {
  AiProviderId,
  GarmentProfile,
  InspirationAnalysisSnapshot,
  PatternExtParameters,
} from '@angaly/types';

export interface WizardFormData {
  garmentType: string;
  occasion: string;
  style: string;
  cutType: string;
  details: Record<string, string>;
  inspirationMediaId?: string | undefined;
  inspirationImageUrl?: string | undefined;
  detectedFeatures?: Record<string, string> | undefined;
  /** Set once a photo was analysed; false = the photo is not a garment (nothing was pre-filled). */
  inspirationIsGarment?: boolean | undefined;
  /** Full classification of the photo, shown under the preview on the Inspiration step. */
  inspirationProfile?: GarmentProfile | undefined;
  /** Observations + profile as saved on the project (sent with every autosave). */
  inspirationAnalysis?: InspirationAnalysisSnapshot | undefined;
  measurementProfileId?: string | undefined;
  /** Ease / fullness / lengths chosen on the Mesures step (empty = engine defaults). */
  fit?: PatternExtParameters | undefined;
  measurements?: Record<string, number> | undefined;
  /** AI model chosen for this generation; undefined = the atelier's automatic routing. */
  aiProvider?: AiProviderId | undefined;
}

export type WizardStepKey =
  | 'garmentType'
  | 'occasion'
  | 'style'
  | 'cut'
  | 'details'
  | 'inspiration'
  | 'measurements';

export interface StepDefinition {
  index: number;
  key: WizardStepKey;
  label: string;
}

/**
 * Inspiration comes first: a photo pre-fills every following step (see `applyInspiration`),
 * so the customer only has to confirm or adjust.
 */
export const WIZARD_STEPS: StepDefinition[] = [
  { index: 1, key: 'inspiration', label: 'Inspiration' },
  { index: 2, key: 'garmentType', label: 'Vêtement' },
  { index: 3, key: 'occasion', label: 'Occasion' },
  { index: 4, key: 'style', label: 'Style' },
  { index: 5, key: 'cut', label: 'Coupe' },
  { index: 6, key: 'details', label: 'Détails' },
  { index: 7, key: 'measurements', label: 'Mesures' },
];

export const stepKeyAt = (index: number): WizardStepKey | undefined =>
  WIZARD_STEPS.find((step) => step.index === index)?.key;
