import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Role } from '@angaly/types';

import { AdminSidebar } from '../ui/AdminSidebar';

const useSessionMock = vi.fn();
vi.mock('next-auth/react', () => ({ useSession: () => useSessionMock(), signOut: vi.fn() }));
vi.mock('next/navigation', () => ({ usePathname: () => '/dashboard' }));

function renderAs(role: Role) {
  useSessionMock.mockReturnValue({ data: { user: { role } } });
  render(<AdminSidebar />);
}

describe('AdminSidebar', () => {
  it('shows every entry to an ADMIN', () => {
    renderAs(Role.ADMIN);
    for (const name of [
      'Tableau de bord',
      'Projets de création',
      'Gestion de contenu',
      'Médiathèque',
      'Paramètres IA',
    ]) {
      expect(screen.getByRole('link', { name })).toBeInTheDocument();
    }
  });

  it('hides the AI settings from a MANAGER', () => {
    renderAs(Role.MANAGER);
    expect(screen.getByRole('link', { name: 'Projets de création' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Gestion de contenu' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Paramètres IA' })).not.toBeInTheDocument();
  });

  it('shows dashboard and creation projects to a COUTURIERE', () => {
    renderAs(Role.COUTURIERE);
    expect(screen.getByRole('link', { name: 'Tableau de bord' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Projets de création' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Gestion de contenu' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Médiathèque' })).not.toBeInTheDocument();
  });
});
