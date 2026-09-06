import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { withQueryClient } from '@/lib/test-utils';

import { HomePage } from '../ui/HomePage';

describe('HomePage', () => {
  it('renders the hero, static sections, and resolves API-backed sections', async () => {
    const Wrapper = withQueryClient();
    render(<HomePage />, { wrapper: Wrapper });

    // Hero (static content, no loading state)
    expect(screen.getByRole('heading', { level: 1, name: 'ANGALY' })).toBeInTheDocument();
    expect(screen.getByText("L'élégance, créée pour vous.")).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Prendre rendez-vous' })).toBeInTheDocument();

    // Static sections
    expect(screen.getByText('Une maison de couture pensée pour vous.')).toBeInTheDocument();
    expect(screen.getByText('Angaly Pattern Studio')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: "L'Expérience Sur Mesure" })).toBeInTheDocument();
    expect(screen.getByText('Elles nous ont fait confiance')).toBeInTheDocument();

    // API-backed sections resolve
    await waitFor(() => expect(screen.getByText('Robe Éternelle')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Atelier Antananarivo Centre')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Choisir sa robe de mariée')).toBeInTheDocument());

    // Newsletter form
    expect(screen.getByLabelText('Adresse e-mail')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: "S'inscrire" })).toBeInTheDocument();
  });
});
