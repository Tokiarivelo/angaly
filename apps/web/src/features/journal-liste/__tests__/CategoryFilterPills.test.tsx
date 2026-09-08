import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { CategoryFilterPills } from '../ui/CategoryFilterPills';

describe('CategoryFilterPills', () => {
  it('renders all 7 real pills with "Tout" pressed by default', () => {
    render(<CategoryFilterPills active={null} onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Tout' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Mariage à Madagascar' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getAllByRole('button')).toHaveLength(7);
  });

  it('calls onChange with the pill slug when clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CategoryFilterPills active={null} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Conseils mode' }));

    expect(onChange).toHaveBeenCalledWith('conseils-mode');
  });

  it('calls onChange with null when "Tout" is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CategoryFilterPills active="conseils-mode" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Tout' }));

    expect(onChange).toHaveBeenCalledWith(null);
  });
});
