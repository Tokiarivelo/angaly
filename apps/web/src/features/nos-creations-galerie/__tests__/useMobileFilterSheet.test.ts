import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useMobileFilterSheet } from '../hooks/useMobileFilterSheet';

describe('useMobileFilterSheet', () => {
  it('starts closed', () => {
    const { result } = renderHook(() => useMobileFilterSheet());
    expect(result.current.isOpen).toBe(false);
  });

  it('opens and closes', () => {
    const { result } = renderHook(() => useMobileFilterSheet());

    act(() => result.current.open());
    expect(result.current.isOpen).toBe(true);

    act(() => result.current.close());
    expect(result.current.isOpen).toBe(false);
  });
});
