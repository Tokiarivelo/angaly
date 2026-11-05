import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useShaderWarmup } from '../hooks/useShaderWarmup';

const deferred = () => {
  let resolve!: () => void;
  let reject!: (e: Error) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe('useShaderWarmup', () => {
  it('is ready at once when there is nothing to warm', () => {
    const { result } = renderHook(() => useShaderWarmup(null));
    expect(result.current).toBe(true);
  });

  it('becomes ready when the warm-up resolves', async () => {
    const d = deferred();
    const warm = () => d.promise;
    const { result } = renderHook(() => useShaderWarmup(warm));
    expect(result.current).toBe(false);
    await act(async () => d.resolve());
    expect(result.current).toBe(true);
  });

  it('is ready too when the warm-up fails or throws', async () => {
    const d = deferred();
    const failing = () => d.promise;
    const { result } = renderHook(() => useShaderWarmup(failing));
    await act(async () => d.reject(new Error('no KHR_parallel_shader_compile')));
    expect(result.current).toBe(true);
    const throwing = () => {
      throw new Error('context lost');
    };
    const { result: thrown } = renderHook(() => useShaderWarmup(throwing));
    expect(thrown.current).toBe(true);
  });

  it('waits again for a new warm-up and ignores the stale one', async () => {
    const first = deferred();
    const second = deferred();
    const warmA = () => first.promise;
    const warmB = () => second.promise;
    const { result, rerender } = renderHook(({ warm }) => useShaderWarmup(warm), { initialProps: { warm: warmA } });
    rerender({ warm: warmB });
    await act(async () => first.resolve());
    expect(result.current).toBe(false);
    await act(async () => second.resolve());
    expect(result.current).toBe(true);
  });

  it('does nothing after unmount', async () => {
    const d = deferred();
    const warm = () => d.promise;
    const { result, unmount } = renderHook(() => useShaderWarmup(warm));
    unmount();
    await act(async () => d.resolve());
    expect(result.current).toBe(false);
  });
});
