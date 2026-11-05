import { useCallback, useMemo, useRef, useState } from 'react';
import type { DeviceHints, LightingPresetName, QualityTierName } from '../utils/studio3d/studio-config';
import {
  parseStudioSettings,
  STUDIO_SETTINGS_KEY,
  type StudioQualityChoice,
  type StudioSettings,
  type StudioViewSettings,
} from '../utils/studio3d/studio-settings';
import { readDeviceHints, useStudioQuality } from './useStudioQuality';

/** `window.localStorage`, or null when the browser refuses it (private mode, blocked site data, SSR). */
const browserStorage = (): Storage | null => {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
};

const load = (storage: () => Storage | null): StudioSettings => {
  try {
    return parseStudioSettings(storage()?.getItem(STUDIO_SETTINGS_KEY));
  } catch {
    return parseStudioSettings(null);
  }
};

const save = (storage: () => Storage | null, settings: StudioSettings): void => {
  try {
    storage()?.setItem(STUDIO_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Remembering the choice is a convenience: the viewer works the same without it.
  }
};

export interface StudioSettingsState {
  settings: StudioSettings;
  /** The tier actually rendered: the chosen one, or the automatic one when `quality` is `auto`. */
  tier: QualityTierName;
  /** What both 3D viewers receive. */
  view: StudioViewSettings;
  setLighting: (lighting: LightingPresetName) => void;
  setShadows: (on: boolean) => void;
  setAo: (on: boolean) => void;
  setQuality: (quality: StudioQualityChoice) => void;
}

/**
 * The studio settings of the 3D panel (light, shadows, ambient occlusion, quality), shared by the preview and the
 * realistic render, remembered per browser. In `auto`, the tier comes from the device and steps down while frames
 * are slow (`nextTierOnSlowFrames`); a chosen tier is kept whatever the frame times.
 */
export const useStudioSettings = (
  options: { storage?: () => Storage | null; hints?: () => DeviceHints } = {},
): StudioSettingsState => {
  const storage = useRef(options.storage ?? browserStorage).current;
  const [settings, setSettings] = useState<StudioSettings>(() => load(storage));
  const auto = useStudioQuality(options.hints ?? readDeviceHints);
  const isAuto = settings.quality === 'auto';
  const tier = isAuto ? auto.tier : (settings.quality as QualityTierName);

  const update = useCallback(
    (patch: Partial<StudioSettings>) =>
      setSettings((current) => {
        const next = { ...current, ...patch };
        save(storage, next);
        return next;
      }),
    [storage],
  );

  // Frame times only drive the automatic tier.
  const autoReport = auto.reportFrame;
  const reportFrame = useCallback((dtMs: number) => (isAuto ? autoReport(dtMs) : undefined), [isAuto, autoReport]);

  const view = useMemo<StudioViewSettings>(
    () => ({ lighting: settings.lighting, shadows: settings.shadows, ao: settings.ao, tier, reportFrame }),
    [settings.lighting, settings.shadows, settings.ao, tier, reportFrame],
  );

  return {
    settings,
    tier,
    view,
    setLighting: useCallback((lighting: LightingPresetName) => update({ lighting }), [update]),
    setShadows: useCallback((shadows: boolean) => update({ shadows }), [update]),
    setAo: useCallback((ao: boolean) => update({ ao }), [update]),
    setQuality: useCallback((quality: StudioQualityChoice) => update({ quality }), [update]),
  };
};
