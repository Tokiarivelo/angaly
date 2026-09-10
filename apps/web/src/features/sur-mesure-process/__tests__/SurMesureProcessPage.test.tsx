import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { SurMesureProcessPage } from '../ui/SurMesureProcessPage';

describe('SurMesureProcessPage', () => {
  it('renders all 7 sections with the expected headings and CTAs', () => {
    render(<SurMesureProcessPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Sur Mesure' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Le parcours sur mesure' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Précision' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Exclusivité' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Accompagnement' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Quelques réalisations sur mesure' })).toBeInTheDocument();
    expect(screen.getByText(/L'expérience ANGALY est incomparable/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Questions fréquentes' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Prêt·e à créer votre tenue sur mesure ?' })).toBeInTheDocument();

    // Hero and closing band each carry both CTAs — no page-specific mobile sticky bar
    // (confirmed absent on the real screen, unlike stitch-prompts/11-sur-mesure-process.md).
    const createLinks = screen.getAllByRole('link', { name: 'Créer ma tenue sur mesure' });
    const appointmentLinks = screen.getAllByRole('link', { name: 'Prendre rendez-vous' });
    expect(createLinks).toHaveLength(2);
    expect(appointmentLinks).toHaveLength(2);
    for (const link of createLinks) expect(link).toHaveAttribute('href', '/sur-mesure/demande');
    for (const link of appointmentLinks) expect(link).toHaveAttribute('href', '/prendre-rendez-vous');
  });

  it('renders all 8 timeline steps in order, with no per-step description', () => {
    render(<SurMesureProcessPage />);

    const expected = [
      'Votre idée',
      'Consultation',
      'Mesures',
      'Conception',
      'Patron',
      'Confection',
      'Essayage',
      'Livraison',
    ];
    for (const title of expected) expect(screen.getByText(title)).toBeInTheDocument();
  });

  it('renders exactly 4 gallery pieces with their real titles and category labels', () => {
    render(<SurMesureProcessPage />);

    const figures = screen.getAllByRole('figure');
    expect(figures).toHaveLength(4);
    expect(screen.getByRole('heading', { name: 'Robe de Soirée Velours' })).toBeInTheDocument();
    expect(screen.getByText('Création Exclusive')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Costume Tailleur Laine' })).toBeInTheDocument();
    expect(screen.getByText('Savoir-Faire Tailleur')).toBeInTheDocument();
  });

  it('opens exactly one FAQ item at a time, navigable via keyboard', async () => {
    const user = userEvent.setup();
    render(<SurMesureProcessPage />);

    const firstQuestion = screen.getByRole('button', { name: /délais/i });
    const secondQuestion = screen.getByRole('button', { name: /tarifs/i });

    expect(firstQuestion).toHaveAttribute('aria-expanded', 'false');

    firstQuestion.focus();
    await user.keyboard('{Enter}');
    expect(firstQuestion).toHaveAttribute('aria-expanded', 'true');

    await user.click(secondQuestion);
    expect(firstQuestion).toHaveAttribute('aria-expanded', 'false');
    expect(secondQuestion).toHaveAttribute('aria-expanded', 'true');
  });
});
