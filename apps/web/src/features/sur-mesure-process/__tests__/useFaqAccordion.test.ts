import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useFaqAccordion } from '../hooks/useFaqAccordion';

describe('useFaqAccordion', () => {
  it('starts with no item open', () => {
    const { result } = renderHook(() => useFaqAccordion());

    expect(result.current.openIndex).toBeNull();
  });

  it('opens an item on toggle', () => {
    const { result } = renderHook(() => useFaqAccordion());

    act(() => result.current.toggle(1));

    expect(result.current.openIndex).toBe(1);
  });

  it('closes the open item when toggled again', () => {
    const { result } = renderHook(() => useFaqAccordion());

    act(() => result.current.toggle(1));
    act(() => result.current.toggle(1));

    expect(result.current.openIndex).toBeNull();
  });

  it('keeps only one item open at a time', () => {
    const { result } = renderHook(() => useFaqAccordion());

    act(() => result.current.toggle(0));
    act(() => result.current.toggle(2));

    expect(result.current.openIndex).toBe(2);
  });
});
