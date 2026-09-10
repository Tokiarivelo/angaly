import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { withQueryClient } from '@/lib/test-utils';

import { useForgotPasswordForm } from '../hooks/useForgotPasswordForm';

const FAKE_SUBMIT_EVENT = { preventDefault: () => {} } as unknown as React.FormEvent<HTMLFormElement>;

describe('useForgotPasswordForm', () => {
  it('reports a validation error for the default (empty) email on submit', async () => {
    const { result } = renderHook(() => useForgotPasswordForm(), { wrapper: withQueryClient() });

    await act(async () => {
      await result.current.handleSubmit(result.current.onSubmit)(FAKE_SUBMIT_EVENT);
    });

    await waitFor(() => expect(result.current.errors.email).toBeDefined());
  });

  it('submits successfully with a valid email (mocked via MSW)', async () => {
    const { result } = renderHook(() => useForgotPasswordForm(), { wrapper: withQueryClient() });

    act(() => {
      result.current.onSubmit({ email: 'client@example.com' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.isError).toBe(false);
  });

  it('starts idle: not submitting, no success, no error', () => {
    const { result } = renderHook(() => useForgotPasswordForm(), { wrapper: withQueryClient() });

    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);
  });
});
