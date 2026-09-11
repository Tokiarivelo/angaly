import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { CategoryKind, type CategoryDto } from '@angaly/types';

import { ActiveFilterChips } from '../ui/ActiveFilterChips';

const CATEGORY: CategoryDto = { id: 'cat-1', slug: 'robes-de-mariee', name: 'Robes de mariée', kind: CategoryKind.CREATION };

describe('ActiveFilterChips', () => {
  it('renders nothing when no category is selected', () => {
    const { container } = render(<ActiveFilterChips category={null} onReset={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows a removable chip with the category name and a "Réinitialiser les filtres" link', () => {
    render(<ActiveFilterChips category={CATEGORY} onReset={vi.fn()} />);

    expect(screen.getByRole('button', { name: /Robes de mariée/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Réinitialiser les filtres' })).toBeInTheDocument();
  });

  it('calls onReset from the chip and from "Réinitialiser les filtres"', async () => {
    const onReset = vi.fn();
    const user = userEvent.setup();
    render(<ActiveFilterChips category={CATEGORY} onReset={onReset} />);

    await user.click(screen.getByRole('button', { name: /Robes de mariée/ }));
    expect(onReset).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Réinitialiser les filtres' }));
    expect(onReset).toHaveBeenCalledTimes(2);
  });

  it('shows chips for genre, type, color, and style with remove handlers', async () => {
    const onRemoveGenre = vi.fn();
    const onRemoveType = vi.fn();
    const onRemoveColor = vi.fn();
    const onRemoveStyle = vi.fn();
    const user = userEvent.setup();

    render(
      <ActiveFilterChips
        genre="Femme"
        type="Mariage"
        color="Ivoire"
        style="Classique"
        onRemoveGenre={onRemoveGenre}
        onRemoveType={onRemoveType}
        onRemoveColor={onRemoveColor}
        onRemoveStyle={onRemoveStyle}
        onReset={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /Genre: Femme/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Type: Mariage/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Couleur: Ivoire/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Style: Classique/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Genre: Femme/ }));
    expect(onRemoveGenre).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /Type: Mariage/ }));
    expect(onRemoveType).toHaveBeenCalledTimes(1);
  });
});
