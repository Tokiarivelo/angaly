export interface WizardFormData {
  garmentType: string;
  occasion: string;
  style: string;
  cutType: string;
  details: Record<string, string>;
  inspirationMediaId?: string | undefined;
  inspirationImageUrl?: string | undefined;
  detectedFeatures?: Record<string, string> | undefined;
  measurementProfileId?: string | undefined;
  measurements?: Record<string, number> | undefined;
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

export const WIZARD_STEPS: StepDefinition[] = [
  { index: 1, key: 'garmentType', label: 'Vêtement' },
  { index: 2, key: 'occasion', label: 'Occasion' },
  { index: 3, key: 'style', label: 'Style' },
  { index: 4, key: 'cut', label: 'Coupe' },
  { index: 5, key: 'details', label: 'Détails' },
  { index: 6, key: 'inspiration', label: 'Inspiration' },
  { index: 7, key: 'measurements', label: 'Mesures' },
];
