import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { MobileFilterSheet } from '../ui/MobileFilterSheet';

describe('MobileFilterSheet', () => {
  it('renders nothing when closed', () => {
    render(<MobileFilterSheet isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('lists the 5 real decorative filter labels and the "Voir les résultats" CTA when open', () => {
    render(<MobileFilterSheet isOpen onClose={vi.fn()} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    for (const label of ['Genre', 'Type', 'Catégorie', 'Couleur', 'Style']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByRole('button', { name: 'Voir les résultats' })).toBeInTheDocument();
  });

  it('calls onClose from the close button and from "Voir les résultats"', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<MobileFilterSheet isOpen onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Fermer les filtres' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    onClose.mockClear();
    render(<MobileFilterSheet isOpen onClose={onClose} />);
    await user.click(screen.getAllByRole('button', { name: 'Voir les résultats' })[0]!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
