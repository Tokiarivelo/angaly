import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/lib/msw/server';
import { withQueryClient } from '@/lib/test-utils';

import { ContactForm } from '../ui/ContactForm';

describe('ContactForm', () => {
  it('shows validation errors and does not submit when required fields are empty', async () => {
    const user = userEvent.setup();
    render(<ContactForm />, { wrapper: withQueryClient() });

    await user.click(screen.getByRole('button', { name: 'Envoyer le message' }));

    expect(await screen.findByText('Le prénom est requis')).toBeInTheDocument();
    expect(screen.getByText('Le nom est requis')).toBeInTheDocument();
    expect(screen.getByText("L'adresse e-mail est requise")).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('submits successfully and shows the confirmation message', async () => {
    const user = userEvent.setup();
    render(<ContactForm />, { wrapper: withQueryClient() });

    await user.type(screen.getByLabelText('Prénom'), 'Nirina');
    await user.type(screen.getByLabelText('Nom'), 'Rakoto');
    await user.type(screen.getByLabelText('Email'), 'nirina@example.com');
    await user.selectOptions(screen.getByLabelText('Sujet'), 'general');
    await user.type(screen.getByLabelText('Message'), 'Bonjour, je souhaiterais un rendez-vous.');
    await user.click(screen.getByRole('button', { name: 'Envoyer le message' }));

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Merci, votre message a bien été envoyé.'),
    );
  });

  it('disables the submit button and shows "Envoi…" while the request is pending', async () => {
    server.use(
      http.post('http://localhost:3003/api/ateliers/contact-messages', async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return HttpResponse.json({ success: true, data: { received: true } });
      }),
    );

    const user = userEvent.setup();
    render(<ContactForm />, { wrapper: withQueryClient() });

    await user.type(screen.getByLabelText('Prénom'), 'Nirina');
    await user.type(screen.getByLabelText('Nom'), 'Rakoto');
    await user.type(screen.getByLabelText('Email'), 'nirina@example.com');
    await user.selectOptions(screen.getByLabelText('Sujet'), 'general');
    await user.type(screen.getByLabelText('Message'), 'Bonjour, je souhaiterais un rendez-vous.');
    await user.click(screen.getByRole('button', { name: 'Envoyer le message' }));

    expect(await screen.findByRole('button', { name: 'Envoi…' })).toBeDisabled();
  });

  it('shows an error message and lets the visitor retry when the API call fails', async () => {
    server.use(
      http.post('http://localhost:3003/api/ateliers/contact-messages', () =>
        HttpResponse.json(
          { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed' } },
          { status: 500 },
        ),
      ),
    );

    const user = userEvent.setup();
    render(<ContactForm />, { wrapper: withQueryClient() });

    await user.type(screen.getByLabelText('Prénom'), 'Nirina');
    await user.type(screen.getByLabelText('Nom'), 'Rakoto');
    await user.type(screen.getByLabelText('Email'), 'nirina@example.com');
    await user.selectOptions(screen.getByLabelText('Sujet'), 'general');
    await user.type(screen.getByLabelText('Message'), 'Bonjour, je souhaiterais un rendez-vous.');
    await user.click(screen.getByRole('button', { name: 'Envoyer le message' }));

    expect(await screen.findByText(/Une erreur est survenue/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Envoyer le message' })).not.toBeDisabled();
  });
});
