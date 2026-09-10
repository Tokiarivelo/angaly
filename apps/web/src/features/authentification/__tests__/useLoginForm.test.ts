import { act, renderHook, waitFor } from '@testing-library/react';
import { signIn } from 'next-auth/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { withQueryClient } from '@/lib/test-utils';

import { useLoginForm } from '../hooks/useLoginForm';

vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}));

const FAKE_SUBMIT_EVENT = { preventDefault: () => {} } as unknown as React.FormEvent<HTMLFormElement>;

describe('useLoginForm', () => {
  beforeEach(() => {
    vi.mocked(signIn).mockReset();
  });

  it('reports validation errors for the default (empty) form values on submit', async () => {
    const { result } = renderHook(() => useLoginForm(), { wrapper: withQueryClient() });

    await act(async () => {
      await result.current.handleSubmit(result.current.onSubmit)(FAKE_SUBMIT_EVENT);
    });

    await waitFor(() => {
      expect(result.current.errors.email).toBeDefined();
      expect(result.current.errors.password).toBeDefined();
    });
  });

  it('calls signIn with the login mode and submitted credentials', async () => {
    vi.mocked(signIn).mockResolvedValue({ error: undefined, ok: true, status: 200, url: null } as never);
    const { result } = renderHook(() => useLoginForm(), { wrapper: withQueryClient() });

    act(() => {
      result.current.onSubmit({ email: 'client@example.com', password: 'password123' });
    });

    await waitFor(() => expect(signIn).toHaveBeenCalledTimes(1));
    expect(signIn).toHaveBeenCalledWith('credentials', {
      email: 'client@example.com',
      password: 'password123',
      mode: 'login',
      redirect: false,
    });
    await waitFor(() => expect(result.current.isError).toBe(false));
  });

  it('surfaces the backend error message on invalid credentials', async () => {
    vi.mocked(signIn).mockResolvedValue({ error: 'Identifiants invalides.', ok: false, status: 401, url: null } as never);
    const { result } = renderHook(() => useLoginForm(), { wrapper: withQueryClient() });

    act(() => {
      result.current.onSubmit({ email: 'client@example.com', password: 'wrong' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.errorMessage).toBe('Identifiants invalides.');
  });

  it('starts idle: not submitting, no error', () => {
    const { result } = renderHook(() => useLoginForm(), { wrapper: withQueryClient() });

    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.isError).toBe(false);
  });
});
