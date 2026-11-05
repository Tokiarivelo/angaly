import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readDeviceHints, useStudioQuality } from '../hooks/useStudioQuality';
import { SLOW_FRAME_WINDOW } from '../utils/studio3d/studio-config';

const desktop = () => ({ coarsePointer: false, minSide: 1080, deviceMemory: 8 });

describe('useStudioQuality', () => {
  it('starts from the device', () => {
    expect(renderHook(() => useStudioQuality(desktop)).result.current.tier).toBe('high');
    expect(renderHook(() => useStudioQuality(() => ({ coarsePointer: true, minSide: 400 }))).result.current.tier).toBe('low');
  });

  it('steps down one tier per slow window, never back up', () => {
    const { result } = renderHook(() => useStudioQuality(desktop));
    act(() => {
      for (let i = 0; i < SLOW_FRAME_WINDOW; i += 1) result.current.reportFrame(45);
    });
    expect(result.current.tier).toBe('medium');
    // The window starts over after a step: a few slow frames are not enough.
    act(() => {
      for (let i = 0; i < SLOW_FRAME_WINDOW - 1; i += 1) result.current.reportFrame(45);
    });
    expect(result.current.tier).toBe('medium');
    act(() => result.current.reportFrame(45));
    expect(result.current.tier).toBe('low');
    act(() => {
      for (let i = 0; i < SLOW_FRAME_WINDOW * 2; i += 1) result.current.reportFrame(8);
    });
    expect(result.current.tier).toBe('low');
  });

  it('ignores idle gaps between on-demand frames', () => {
    const { result } = renderHook(() => useStudioQuality(desktop));
    act(() => {
      for (let i = 0; i < SLOW_FRAME_WINDOW; i += 1) result.current.reportFrame(5000);
    });
    expect(result.current.tier).toBe('high');
  });
});

describe('readDeviceHints', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('reads the pointer, the window and the memory', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q === '(pointer: coarse)' }));
    Object.defineProperty(navigator, 'deviceMemory', { value: 4, configurable: true });
    const hints = readDeviceHints();
    expect(hints.coarsePointer).toBe(true);
    expect(hints.minSide).toBe(Math.min(window.innerWidth, window.innerHeight));
    expect(hints.deviceMemory).toBe(4);
  });
});
