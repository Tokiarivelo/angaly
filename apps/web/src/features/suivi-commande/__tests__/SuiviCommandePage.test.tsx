import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SuiviCommandePage } from '../ui/SuiviCommandePage';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('SuiviCommandePage', () => {
  it('renders page correctly', () => {
    render(<SuiviCommandePage orderNumber="ANG-2938" />);
    expect(screen.getByText('Commande #ANG-2938')).toBeInTheDocument();
    expect(screen.getByText('Avancement de la production')).toBeInTheDocument();
    expect(screen.getByText('Récapitulatif')).toBeInTheDocument();
    expect(screen.getByText(/Contacter ANGALY/i)).toBeInTheDocument();
  });
});
