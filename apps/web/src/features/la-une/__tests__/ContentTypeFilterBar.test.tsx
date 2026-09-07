import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ContentTypeFilterBar } from '../ui/ContentTypeFilterBar';

describe('ContentTypeFilterBar', () => {
  it('renders the real screen\'s 5 pills with the active one marked pressed', () => {
    render(<ContentTypeFilterBar activeFilter="all" onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Tout' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Création du mois' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Collection du moment' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sur Mesure' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Coulisses' })).toBeInTheDocument();
  });

  it('calls onChange with the clicked pill value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ContentTypeFilterBar activeFilter="all" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Sur Mesure' }));

    expect(onChange).toHaveBeenCalledWith('sur-mesure');
  });
});
