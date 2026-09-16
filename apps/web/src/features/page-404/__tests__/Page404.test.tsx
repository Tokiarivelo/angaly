import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { withQueryClient } from '@/lib/test-utils';

import { Page404 } from '../ui/Page404';

describe('Page404', () => {
  it('renders the exact spec §94 message, not a generic 404 message', () => {
    render(<Page404 />, { wrapper: withQueryClient() });
    expect(
      screen.getByRole('heading', { level: 1, name: "Cette création semble avoir disparu de l'atelier..." }),
    ).toBeInTheDocument();
    expect(screen.getByText("La page que vous cherchez n'existe plus ou a été déplacée.")).toBeInTheDocument();
  });

  it('renders the primary and secondary action buttons with real hrefs', () => {
    render(<Page404 />, { wrapper: withQueryClient() });
    expect(screen.getByRole('link', { name: 'Retour aux créations' })).toHaveAttribute('href', '/creations');
    expect(screen.getByRole('link', { name: "Retour à l'accueil" })).toHaveAttribute('href', '/');
  });

  it('renders the quick links row', () => {
    render(<Page404 />, { wrapper: withQueryClient() });
    expect(screen.getByText('Vous cherchiez peut-être :')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Nos Créations' })).toBeInTheDocument();
  });

  it('renders the minimal ANGALY header', () => {
    render(<Page404 />, { wrapper: withQueryClient() });
    expect(screen.getByText('ANGALY')).toBeInTheDocument();
  });
});
