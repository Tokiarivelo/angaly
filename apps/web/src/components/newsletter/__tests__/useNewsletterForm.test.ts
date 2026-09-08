import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { withQueryClient } from '@/lib/test-utils';

import { useNewsletterForm } from '../useNewsletterForm';

const FAKE_SUBMIT_EVENT = { preventDefault: () => {} } as unknown as React.FormEvent<HTMLFormElement>;

describe('useNewsletterForm', () => {
  it('reports validation errors for the default (empty) form values on submit', async () => {
    const { result } = renderHook(() => useNewsletterForm(), { wrapper: withQueryClient() });

    await act(async () => {
      await result.current.handleSubmit(result.current.onSubmit)(FAKE_SUBMIT_EVENT);
    });

    await waitFor(() => {
      expect(result.current.errors.email).toBeDefined();
      expect(result.current.errors.consent).toBeDefined();
    });
  });

  it('submits successfully with a valid email and consent', async () => {
    const { result } = renderHook(() => useNewsletterForm(), { wrapper: withQueryClient() });

    act(() => {
      result.current.onSubmit({ email: 'client@example.com', consent: true });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.isError).toBe(false);
  });

  it('starts idle: not submitting, no success, no error', () => {
    const { result } = renderHook(() => useNewsletterForm(), { wrapper: withQueryClient() });

    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);
  });
});
