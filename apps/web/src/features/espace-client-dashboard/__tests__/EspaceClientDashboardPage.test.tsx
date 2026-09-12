import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EspaceClientDashboardPage } from '../ui/EspaceClientDashboardPage';

describe('EspaceClientDashboardPage', () => {
  it('renders dashboard with mock data', () => {
    render(<EspaceClientDashboardPage />);
    expect(screen.getByText(/Bonjour, Toki/i)).toBeInTheDocument();
    expect(screen.getByText('Prochain rendez-vous')).toBeInTheDocument();
    expect(screen.getByText('Accès rapide')).toBeInTheDocument();
  });
});
