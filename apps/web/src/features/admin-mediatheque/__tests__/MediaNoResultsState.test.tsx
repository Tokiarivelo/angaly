import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { MediaNoResultsState } from '../ui/MediaNoResultsState';

describe('MediaNoResultsState', () => {
  it('calls onResetFilters when the reset link is clicked', async () => {
    const onResetFilters = vi.fn();
    const user = userEvent.setup();
    render(<MediaNoResultsState onResetFilters={onResetFilters} />);

    await user.click(screen.getByRole('button', { name: 'Réinitialiser les filtres' }));

    expect(onResetFilters).toHaveBeenCalled();
  });
});
