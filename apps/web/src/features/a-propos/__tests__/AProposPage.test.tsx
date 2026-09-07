import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AProposPage } from '../ui/AProposPage';

describe('AProposPage', () => {
  it('renders all 7 sections of the real screen with no "Valeurs" section', () => {
    render(<AProposPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Notre histoire' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Comment tout a commencé' })).toBeInTheDocument();
    expect(screen.getByText('1998')).toBeInTheDocument();
    expect(screen.getByText('2010')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Qui est Angaly ?' })).toBeInTheDocument();
    expect(
      screen.getByText(/Un vêtement n'est pas qu'une parure/),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Notre Savoir-Faire' })).toBeInTheDocument();
    expect(screen.getByText(/Nous ne créons pas de la mode/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: "L'Atelier" })).toBeInTheDocument();
    expect(screen.getByText('Matières Nobles')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: "Incarnez l'élégance" })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Découvrir nos créations' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Prendre rendez-vous' })).toBeInTheDocument();

    // The text-prompt-only "Valeurs" section (Excellence/Authenticité/...) doesn't exist
    // on the real screen — asserting its absence guards against reintroducing it.
    expect(screen.queryByText('Excellence')).not.toBeInTheDocument();
  });
});
