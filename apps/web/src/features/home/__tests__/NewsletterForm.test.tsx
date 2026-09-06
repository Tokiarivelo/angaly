import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/lib/msw/server';
import { withQueryClient } from '@/lib/test-utils';

import { NewsletterForm } from '../ui/NewsletterForm';

describe('NewsletterForm', () => {
  it('shows validation errors and does not submit when the email is invalid and consent is unchecked', async () => {
    const user = userEvent.setup();
    render(<NewsletterForm />, { wrapper: withQueryClient() });

    await user.type(screen.getByLabelText('Adresse e-mail'), 'not-an-email');
    await user.click(screen.getByRole('button', { name: "S'inscrire" }));

    expect(await screen.findByText('Adresse e-mail invalide')).toBeInTheDocument();
    expect(screen.getByText('Vous devez accepter de recevoir nos actualités')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('submits successfully and shows the confirmation message', async () => {
    const user = userEvent.setup();
    render(<NewsletterForm />, { wrapper: withQueryClient() });

    await user.type(screen.getByLabelText('Adresse e-mail'), 'client@example.com');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: "S'inscrire" }));

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Merci ! Votre inscription à la newsletter est confirmée.'),
    );
  });

  it('shows an error message and lets the visitor retry when the API call fails (e.g. 404 before notifications ships)', async () => {
    server.use(
      http.post('http://localhost:3001/api/newsletter/subscribe', () =>
        HttpResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Not found' } }, { status: 404 }),
      ),
    );
    const user = userEvent.setup();
    render(<NewsletterForm />, { wrapper: withQueryClient() });

    await user.type(screen.getByLabelText('Adresse e-mail'), 'client@example.com');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: "S'inscrire" }));

    expect(await screen.findByText(/Une erreur est survenue/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: "S'inscrire" })).not.toBeDisabled();
  });
});
