import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ForgotPasswordPage } from '../ui/ForgotPasswordPage';

const mockUseForgotPasswordForm = vi.fn();

vi.mock('../hooks/useForgotPasswordForm', () => ({
  useForgotPasswordForm: () => mockUseForgotPasswordForm(),
}));

function baseHookReturn(overrides: Partial<ReturnType<typeof mockUseForgotPasswordForm>> = {}) {
  return {
    register: () => ({}),
    handleSubmit: () => (event: React.FormEvent) => event.preventDefault(),
    errors: {},
    onSubmit: () => {},
    isSubmitting: false,
    isSuccess: false,
    isError: false,
    ...overrides,
  };
}

describe('ForgotPasswordPage', () => {
  it('renders the form when not yet submitted successfully', () => {
    mockUseForgotPasswordForm.mockReturnValue(baseHookReturn());

    render(<ForgotPasswordPage />);

    expect(screen.getByRole('heading', { name: 'Mot de passe oublié ?' })).toBeInTheDocument();
  });

  it('renders the confirmation card once the request succeeds', () => {
    mockUseForgotPasswordForm.mockReturnValue(baseHookReturn({ isSuccess: true }));

    render(<ForgotPasswordPage />);

    expect(screen.getByRole('heading', { name: 'Email envoyé' })).toBeInTheDocument();
  });
});
