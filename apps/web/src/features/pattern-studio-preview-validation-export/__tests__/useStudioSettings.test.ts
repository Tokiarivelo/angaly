import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useStudioSettings } from '../hooks/useStudioSettings';
import { SLOW_FRAME_WINDOW } from '../utils/studio3d/studio-config';
import { DEFAULT_STUDIO_SETTINGS, parseStudioSettings, STUDIO_SETTINGS_KEY } from '../utils/studio3d/studio-settings';

const desktop = () => ({ coarsePointer: false, minSide: 1080, deviceMemory: 8 });

const memoryStorage = (initial: Record<string, string> = {}): Storage => {
  const data = new Map(Object.entries(initial));
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, value),
  };
};

const slowFrames = (report: (dt: number) => void) => {
  for (let i = 0; i < SLOW_FRAME_WINDOW; i += 1) report(45);
};

describe('parseStudioSettings', () => {
  it('falls back to the defaults on missing, broken or wrong values', () => {
    expect(parseStudioSettings(null)).toEqual(DEFAULT_STUDIO_SETTINGS);
    expect(parseStudioSettings('{not json')).toEqual(DEFAULT_STUDIO_SETTINGS);
    expect(parseStudioSettings('42')).toEqual(DEFAULT_STUDIO_SETTINGS);
    expect(parseStudioSettings(JSON.stringify({ lighting: 'disco', shadows: 'yes', ao: false, quality: 'ultra' }))).toEqual({
      ...DEFAULT_STUDIO_SETTINGS,
      ao: false,
    });
    expect(parseStudioSettings(JSON.stringify({ lighting: 'toString' })).lighting).toBe('studio');
  });
});

describe('useStudioSettings', () => {
  it('starts from the defaults: studio light, shadows, AO, automatic quality', () => {
    const { result } = renderHook(() => useStudioSettings({ storage: () => memoryStorage(), hints: desktop }));
    expect(result.current.settings).toEqual({ lighting: 'studio', shadows: true, ao: true, quality: 'auto' });
    expect(result.current.tier).toBe('high');
    expect(result.current.view).toMatchObject({ lighting: 'studio', shadows: true, ao: true, tier: 'high' });
  });

  it('remembers every choice in the browser and reads it back', () => {
    const storage = memoryStorage();
    const { result } = renderHook(() => useStudioSettings({ storage: () => storage, hints: desktop }));
    act(() => result.current.setLighting('contrast'));
    act(() => result.current.setShadows(false));
    act(() => result.current.setAo(false));
    act(() => result.current.setQuality('low'));
    const expected = { lighting: 'contrast', shadows: false, ao: false, quality: 'low' };
    expect(result.current.settings).toEqual(expected);
    expect(JSON.parse(storage.getItem(STUDIO_SETTINGS_KEY)!)).toEqual(expected);

    const again = renderHook(() => useStudioSettings({ storage: () => storage, hints: desktop }));
    expect(again.result.current.settings).toEqual(expected);
    expect(again.result.current.tier).toBe('low');
  });

  it('works without storage when the browser refuses it', () => {
    const broken = {
      getItem: vi.fn(() => {
        throw new Error('SecurityError');
      }),
      setItem: vi.fn(() => {
        throw new Error('QuotaExceededError');
      }),
    } as unknown as Storage;
    const { result } = renderHook(() => useStudioSettings({ storage: () => broken, hints: desktop }));
    expect(result.current.settings).toEqual(DEFAULT_STUDIO_SETTINGS);
    act(() => result.current.setLighting('soft'));
    expect(result.current.settings.lighting).toBe('soft');

    const throwing = renderHook(() =>
      useStudioSettings({
        storage: () => {
          throw new Error('denied');
        },
        hints: desktop,
      }),
    );
    expect(throwing.result.current.settings).toEqual(DEFAULT_STUDIO_SETTINGS);
  });

  it('uses the real localStorage by default', () => {
    window.localStorage.removeItem(STUDIO_SETTINGS_KEY);
    const { result } = renderHook(() => useStudioSettings({ hints: desktop }));
    act(() => result.current.setShadows(false));
    expect(JSON.parse(window.localStorage.getItem(STUDIO_SETTINGS_KEY)!).shadows).toBe(false);
    window.localStorage.removeItem(STUDIO_SETTINGS_KEY);
  });

  it('steps the tier down on slow frames in auto only', () => {
    const { result } = renderHook(() => useStudioSettings({ storage: () => memoryStorage(), hints: desktop }));
    act(() => slowFrames(result.current.view.reportFrame));
    expect(result.current.tier).toBe('medium');
    expect(result.current.view.tier).toBe('medium');

    // A chosen tier stays, whatever the frame times.
    act(() => result.current.setQuality('high'));
    expect(result.current.tier).toBe('high');
    act(() => slowFrames(result.current.view.reportFrame));
    expect(result.current.tier).toBe('high');

    // Back to auto: the automatic tier where it was left.
    act(() => result.current.setQuality('auto'));
    expect(result.current.tier).toBe('medium');
  });
});
