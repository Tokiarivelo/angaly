import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Role } from '@angaly/types';

import { AdminSidebar } from '../ui/AdminSidebar';

const useSessionMock = vi.fn();
const usePathnameMock = vi.fn(() => '/dashboard');
vi.mock('next-auth/react', () => ({ useSession: () => useSessionMock(), signOut: vi.fn() }));
vi.mock('next/navigation', () => ({ usePathname: () => usePathnameMock() }));

function renderAs(role: Role) {
  useSessionMock.mockReturnValue({ data: { user: { role } } });
  render(<AdminSidebar />);
}

describe('AdminSidebar', () => {
  it('shows every entry to an ADMIN', () => {
    usePathnameMock.mockReturnValue('/dashboard');
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
    usePathnameMock.mockReturnValue('/dashboard');
    renderAs(Role.MANAGER);
    expect(screen.getByRole('link', { name: 'Projets de création' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Gestion de contenu' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Paramètres IA' })).not.toBeInTheDocument();
  });

  it('shows dashboard and creation projects to a COUTURIERE', () => {
    usePathnameMock.mockReturnValue('/dashboard');
    renderAs(Role.COUTURIERE);
    expect(screen.getByRole('link', { name: 'Tableau de bord' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Projets de création' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Gestion de contenu' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Médiathèque' })).not.toBeInTheDocument();
  });

  it('highlights the parent link when on a nested route such as /projets-creation/:projectId', () => {
    usePathnameMock.mockReturnValue('/projets-creation/CRP-2026-xyz');
    renderAs(Role.ADMIN);

    const activeLink = screen.getByRole('link', { name: 'Projets de création' });
    expect(activeLink).toHaveAttribute('aria-current', 'page');
    expect(activeLink.className).toContain('border-[#936C3E]');

    const dashboardLink = screen.getByRole('link', { name: 'Tableau de bord' });
    expect(dashboardLink).not.toHaveAttribute('aria-current');
  });
});

