import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { EmptyState } from '../ui/EmptyState';

describe('EmptyState', () => {
  it('shows the real Stitch message and a "Réinitialiser les filtres" button', () => {
    render(<EmptyState onResetFilters={vi.fn()} />);

    expect(
      screen.getByText('Aucune création ne correspond à ces filtres pour le moment.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Réinitialiser les filtres' })).toBeInTheDocument();
  });

  it('calls onResetFilters when the button is clicked', async () => {
    const onResetFilters = vi.fn();
    const user = userEvent.setup();
    render(<EmptyState onResetFilters={onResetFilters} />);

    await user.click(screen.getByRole('button', { name: 'Réinitialiser les filtres' }));
    expect(onResetFilters).toHaveBeenCalledTimes(1);
  });
});
