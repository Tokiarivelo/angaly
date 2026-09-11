import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { useGoogleMapsConfig } from '../hooks/useGoogleMapsConfig';

describe('useGoogleMapsConfig', () => {
  const originalEnv = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = originalEnv;
    } else {
      delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    }
  });

  it('defaults to editorial mode when NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is unset', () => {
    const { result } = renderHook(() => useGoogleMapsConfig());
    expect(result.current.isConfigured).toBe(false);
    expect(result.current.apiKey).toBe('');
    expect(result.current.viewMode).toBe('editorial');
  });

  it('defaults to google-maps mode when NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is provided', () => {
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'AIzaSyTestKey';
    const { result } = renderHook(() => useGoogleMapsConfig());
    expect(result.current.isConfigured).toBe(true);
    expect(result.current.apiKey).toBe('AIzaSyTestKey');
    expect(result.current.viewMode).toBe('google-maps');
  });

  it('allows toggling between google-maps and editorial view modes', () => {
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'AIzaSyTestKey';
    const { result } = renderHook(() => useGoogleMapsConfig());

    act(() => {
      result.current.setViewMode('editorial');
    });
    expect(result.current.viewMode).toBe('editorial');

    act(() => {
      result.current.setViewMode('google-maps');
    });
    expect(result.current.viewMode).toBe('google-maps');
  });
});
