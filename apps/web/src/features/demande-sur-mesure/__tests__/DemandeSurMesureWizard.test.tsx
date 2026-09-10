import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { withQueryClient } from '@/lib/test-utils';

import { DemandeSurMesureWizard } from '../ui/DemandeSurMesureWizard';

const MOCK_SESSION = {
  user: { id: 'user-1', role: 'CLIENT', email: 'nirina@example.com' },
  accessToken: 'mock-access-token',
};

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: MOCK_SESSION, status: 'authenticated' }),
  getSession: () => Promise.resolve(MOCK_SESSION),
}));

beforeAll(() => {
  URL.createObjectURL = () => 'blob:mock';
});

describe('DemandeSurMesureWizard', () => {
  it('walks through the 3 steps and shows the confirmation card on submit', async () => {
    const user = userEvent.setup();
    const Wrapper = withQueryClient();
    render(
      <Wrapper>
        <DemandeSurMesureWizard />
      </Wrapper>,
    );

    expect(screen.getByRole('heading', { name: 'Demande de création sur mesure' })).toBeInTheDocument();

    // Step 1 — Continuer stays on step 1 until a garment type is chosen.
    await user.click(screen.getByRole('button', { name: 'Continuer' }));
    expect(screen.getByText('Type de vêtement')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Robe de mariée' }));
    await user.click(screen.getByRole('button', { name: 'Continuer' }));

    // Step 2 — read-only contact confirmation from the account.
    await waitFor(() => expect(screen.getByText('Nirina')).toBeInTheDocument());
    expect(screen.getByText('Rakoto')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Continuer' }));

    // Step 3 — submit.
    expect(screen.getByLabelText('Tissu souhaité')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Envoyer ma demande' }));

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Votre demande a bien été envoyée' })).toBeInTheDocument(),
    );
    expect(screen.getByText('ANG-DEV-2026-A1B2C3D4')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Prendre rendez-vous dès maintenant' })).toHaveAttribute(
      'href',
      '/prendre-rendez-vous',
    );
  });

  it('lets the visitor go back a step', async () => {
    const user = userEvent.setup();
    const Wrapper = withQueryClient();
    render(
      <Wrapper>
        <DemandeSurMesureWizard />
      </Wrapper>,
    );

    await user.click(screen.getByRole('button', { name: 'Robe de mariée' }));
    await user.click(screen.getByRole('button', { name: 'Continuer' }));
    await waitFor(() => expect(screen.getByText('Nirina')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Retour' }));

    expect(screen.getByText('Type de vêtement')).toBeInTheDocument();
  });
});
