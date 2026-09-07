import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { withQueryClient } from '@/lib/test-utils';

import { useContactForm } from '../hooks/useContactForm';

const FAKE_SUBMIT_EVENT = { preventDefault: () => {} } as unknown as React.FormEvent<HTMLFormElement>;

describe('useContactForm', () => {
  it('reports validation errors for the default (empty) form values on submit', async () => {
    const { result } = renderHook(() => useContactForm(), { wrapper: withQueryClient() });

    await act(async () => {
      await result.current.handleSubmit(result.current.onSubmit)(FAKE_SUBMIT_EVENT);
    });

    await waitFor(() => {
      expect(result.current.errors.prenom).toBeDefined();
      expect(result.current.errors.nom).toBeDefined();
      expect(result.current.errors.email).toBeDefined();
      expect(result.current.errors.sujet).toBeDefined();
      expect(result.current.errors.message).toBeDefined();
    });
  });

  it('submits successfully with valid values', async () => {
    const { result } = renderHook(() => useContactForm(), { wrapper: withQueryClient() });

    act(() => {
      result.current.onSubmit({
        prenom: 'Nirina',
        nom: 'Rakoto',
        email: 'nirina@example.com',
        telephone: '',
        sujet: 'general',
        message: 'Bonjour, je souhaiterais avoir plus d’informations.',
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.isError).toBe(false);
  });

  it('starts idle: not submitting, no success, no error', () => {
    const { result } = renderHook(() => useContactForm(), { wrapper: withQueryClient() });

    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);
  });
});
