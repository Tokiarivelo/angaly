import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/lib/msw/server';
import { withQueryClient } from '@/lib/test-utils';

import { NewsletterSignupCard } from '../ui/NewsletterSignupCard';

describe('NewsletterSignupCard', () => {
  it('renders the "La Lettre Angaly" title and description', () => {
    render(<NewsletterSignupCard />, { wrapper: withQueryClient() });
    expect(screen.getByText('La Lettre Angaly')).toBeInTheDocument();
  });

  it('submits successfully via the shared newsletter hook and shows the confirmation', async () => {
    const user = userEvent.setup();
    render(<NewsletterSignupCard />, { wrapper: withQueryClient() });

    await user.type(screen.getByLabelText('Adresse e-mail'), 'client@example.com');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: "S'inscrire" }));

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        'Merci ! Votre inscription à la newsletter est confirmée.',
      ),
    );
  });

  it('shows validation errors for an invalid email and unchecked consent', async () => {
    const user = userEvent.setup();
    render(<NewsletterSignupCard />, { wrapper: withQueryClient() });

    await user.type(screen.getByLabelText('Adresse e-mail'), 'not-an-email');
    await user.click(screen.getByRole('button', { name: "S'inscrire" }));

    expect(await screen.findByText('Adresse e-mail invalide')).toBeInTheDocument();
    expect(screen.getByText('Vous devez accepter de recevoir nos actualités')).toBeInTheDocument();
  });

  it('disables the button and shows "Envoi…" while the request is pending', async () => {
    server.use(
      http.post('http://localhost:3003/api/newsletter/subscribe', async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return HttpResponse.json({ success: true, data: { subscribed: true } });
      }),
    );

    const user = userEvent.setup();
    render(<NewsletterSignupCard />, { wrapper: withQueryClient() });

    await user.type(screen.getByLabelText('Adresse e-mail'), 'client@example.com');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: "S'inscrire" }));

    expect(await screen.findByRole('button', { name: 'Envoi…' })).toBeDisabled();
  });

  it('shows an error message when the API call fails', async () => {
    server.use(
      http.post('http://localhost:3003/api/newsletter/subscribe', () =>
        HttpResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Not found' } }, { status: 404 }),
      ),
    );

    const user = userEvent.setup();
    render(<NewsletterSignupCard />, { wrapper: withQueryClient() });

    await user.type(screen.getByLabelText('Adresse e-mail'), 'client@example.com');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: "S'inscrire" }));

    expect(await screen.findByText(/Une erreur est survenue/)).toBeInTheDocument();
  });
});
