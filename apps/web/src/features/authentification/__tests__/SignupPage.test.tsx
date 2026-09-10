import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SignupPage } from '../ui/SignupPage';

vi.mock('../hooks/useSignupForm', () => ({
  useSignupForm: () => ({
    register: () => ({}),
    handleSubmit: () => (event: React.FormEvent) => event.preventDefault(),
    errors: {},
    onSubmit: () => {},
    isSubmitting: false,
    isError: false,
    errorMessage: null,
  }),
}));

describe('SignupPage', () => {
  it('renders without crashing', () => {
    render(<SignupPage />);
    expect(document.body).toBeTruthy();
  });
});
