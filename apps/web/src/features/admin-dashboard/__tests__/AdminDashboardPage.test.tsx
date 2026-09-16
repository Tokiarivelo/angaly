import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AdminDashboardPage } from '../ui/AdminDashboardPage';

describe('AdminDashboardPage', () => {
  it('renders the heading and a link to the AI settings section', () => {
    render(<AdminDashboardPage />);

    expect(screen.getByRole('heading', { name: 'Administration ANGALY' })).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /Paramètres IA/i });
    expect(link).toHaveAttribute('href', '/ai-settings');
  });
});
