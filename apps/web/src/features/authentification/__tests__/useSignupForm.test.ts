import { act, renderHook, waitFor } from '@testing-library/react';
import { signIn } from 'next-auth/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { withQueryClient } from '@/lib/test-utils';

import { useSignupForm } from '../hooks/useSignupForm';

vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}));

const FAKE_SUBMIT_EVENT = { preventDefault: () => {} } as unknown as React.FormEvent<HTMLFormElement>;

const VALID_VALUES = {
  firstName: 'Nirina',
  lastName: 'Rakoto',
  email: 'nirina@example.com',
  phone: '+261 34 12 345 67',
  password: 'password123',
  confirmPassword: 'password123',
  acceptTerms: true,
};

describe('useSignupForm', () => {
  beforeEach(() => {
    vi.mocked(signIn).mockReset();
  });

  it('reports validation errors for the default (empty) form values on submit — phone is optional (verified against the real Stitch markup, no error expected)', async () => {
    const { result } = renderHook(() => useSignupForm(), { wrapper: withQueryClient() });

    await act(async () => {
      await result.current.handleSubmit(result.current.onSubmit)(FAKE_SUBMIT_EVENT);
    });

    await waitFor(() => {
      expect(result.current.errors.firstName).toBeDefined();
      expect(result.current.errors.lastName).toBeDefined();
      expect(result.current.errors.email).toBeDefined();
      expect(result.current.errors.phone).toBeUndefined();
      expect(result.current.errors.password).toBeDefined();
      expect(result.current.errors.acceptTerms).toBeDefined();
    });
  });


  it('calls signIn with the register mode and submitted values', async () => {
    vi.mocked(signIn).mockResolvedValue({ error: undefined, ok: true, status: 200, url: null } as never);
    const { result } = renderHook(() => useSignupForm(), { wrapper: withQueryClient() });

    act(() => {
      result.current.onSubmit(VALID_VALUES);
    });

    await waitFor(() => expect(signIn).toHaveBeenCalledTimes(1));
    expect(signIn).toHaveBeenCalledWith('credentials', {
      email: VALID_VALUES.email,
      password: VALID_VALUES.password,
      firstName: VALID_VALUES.firstName,
      lastName: VALID_VALUES.lastName,
      phone: VALID_VALUES.phone,
      mode: 'register',
      redirect: false,
    });
    await waitFor(() => expect(result.current.isError).toBe(false));
  });

  it('surfaces a duplicate-email error from the backend', async () => {
    vi.mocked(signIn).mockResolvedValue({ error: 'Cet email est déjà utilisé.', ok: false, status: 409, url: null } as never);
    const { result } = renderHook(() => useSignupForm(), { wrapper: withQueryClient() });

    act(() => {
      result.current.onSubmit(VALID_VALUES);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.errorMessage).toBe('Cet email est déjà utilisé.');
  });
});
