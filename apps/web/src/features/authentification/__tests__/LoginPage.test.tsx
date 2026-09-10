import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { LoginPage } from '../ui/LoginPage';

vi.mock('../hooks/useLoginForm', () => ({
  useLoginForm: () => ({
    register: () => ({}),
    handleSubmit: () => (event: React.FormEvent) => event.preventDefault(),
    errors: {},
    onSubmit: () => {},
    isSubmitting: false,
    isError: false,
    errorMessage: null,
  }),
}));

describe('LoginPage', () => {
  it('renders without crashing', () => {
    render(<LoginPage />);
    expect(document.body).toBeTruthy();
  });
});
