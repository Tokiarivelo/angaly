import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useShareArticle } from '../hooks/useShareArticle';

describe('useShareArticle', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('opens a Facebook share intent URL with the current page URL encoded', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    const { result } = renderHook(() => useShareArticle({ title: 'Mon Article' }));

    act(() => result.current.shareToFacebook());

    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('https://www.facebook.com/sharer/sharer.php?u='),
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('opens a WhatsApp share URL including the article title', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    const { result } = renderHook(() => useShareArticle({ title: 'Mon Article' }));

    act(() => result.current.shareToWhatsApp());

    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent('Mon Article')),
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('copies the current URL to the clipboard and resets `copied` after a delay', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    const { result } = renderHook(() => useShareArticle({ title: 'Mon Article' }));

    await act(async () => {
      result.current.copyLink();
      await Promise.resolve();
    });

    expect(writeText).toHaveBeenCalled();
    expect(result.current.copied).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.copied).toBe(false);
  });

  it('does nothing when the Clipboard API is unavailable', () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    const { result } = renderHook(() => useShareArticle({ title: 'Mon Article' }));

    expect(() => act(() => result.current.copyLink())).not.toThrow();
    expect(result.current.copied).toBe(false);
  });
});
