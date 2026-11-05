import { LIGHTING_PRESETS, TIER_ORDER, type LightingPresetName, type QualityTierName } from './studio-config';

/** `auto`: the tier picked from the device, then stepped down while frames are slow. */
export type StudioQualityChoice = 'auto' | QualityTierName;

/** What the user chooses in the « Réglages du rendu » panel. */
export interface StudioSettings {
  lighting: LightingPresetName;
  shadows: boolean;
  ao: boolean;
  quality: StudioQualityChoice;
}

/** What a 3D viewer needs from those settings: the tier actually used, and where to report its frame times. */
export interface StudioViewSettings {
  lighting: LightingPresetName;
  shadows: boolean;
  ao: boolean;
  tier: QualityTierName;
  reportFrame: (dtMs: number) => void;
}

export const DEFAULT_STUDIO_SETTINGS: StudioSettings = { lighting: 'studio', shadows: true, ao: true, quality: 'auto' };

/** `localStorage` key (a per-browser convenience only). */
export const STUDIO_SETTINGS_KEY = 'angaly.studio3d.settings';

export const QUALITY_CHOICES: readonly StudioQualityChoice[] = ['auto', ...TIER_ORDER];

const isLighting = (value: unknown): value is LightingPresetName =>
  typeof value === 'string' && Object.prototype.hasOwnProperty.call(LIGHTING_PRESETS, value);

const isQuality = (value: unknown): value is StudioQualityChoice =>
  typeof value === 'string' && (QUALITY_CHOICES as readonly string[]).includes(value);

/** Reads stored settings; anything missing, of the wrong type or unparsable falls back to its default. */
export const parseStudioSettings = (raw: string | null | undefined): StudioSettings => {
  if (!raw) return DEFAULT_STUDIO_SETTINGS;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return DEFAULT_STUDIO_SETTINGS;
  }
  if (typeof data !== 'object' || data === null) return DEFAULT_STUDIO_SETTINGS;
  const value = data as Record<string, unknown>;
  const d = DEFAULT_STUDIO_SETTINGS;
  return {
    lighting: isLighting(value.lighting) ? value.lighting : d.lighting,
    shadows: typeof value.shadows === 'boolean' ? value.shadows : d.shadows,
    ao: typeof value.ao === 'boolean' ? value.ao : d.ao,
    quality: isQuality(value.quality) ? value.quality : d.quality,
  };
};
