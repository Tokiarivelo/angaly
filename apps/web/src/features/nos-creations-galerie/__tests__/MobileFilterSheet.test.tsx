import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { CategoryKind, type CategoryDto } from '@angaly/types';

import { MobileFilterSheet } from '../ui/MobileFilterSheet';

const CATEGORIES: CategoryDto[] = [
  { id: 'cat-1', slug: 'robes-de-mariee', name: 'Robes de mariée', kind: CategoryKind.CREATION },
  { id: 'cat-2', slug: 'costumes-homme', name: 'Costumes homme', kind: CategoryKind.CREATION },
];

describe('MobileFilterSheet', () => {
  it('renders nothing when closed', () => {
    render(
      <MobileFilterSheet isOpen={false} onClose={vi.fn()} categories={[]} categoryId={null} onCategoryChange={vi.fn()} />,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('lists the 4 decorative filter labels, the real Catégorie select, and the "Voir les résultats" CTA when open', () => {
    render(
      <MobileFilterSheet isOpen onClose={vi.fn()} categories={CATEGORIES} categoryId={null} onCategoryChange={vi.fn()} />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    for (const label of ['Genre', 'Type', 'Couleur', 'Style']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    const select = screen.getByRole('combobox', { name: 'Catégorie' });
    expect(select).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Robes de mariée' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Voir les résultats' })).toBeInTheDocument();
  });

  it('calls onCategoryChange when a real category is selected', async () => {
    const onCategoryChange = vi.fn();
    const user = userEvent.setup();
    render(
      <MobileFilterSheet
        isOpen
        onClose={vi.fn()}
        categories={CATEGORIES}
        categoryId={null}
        onCategoryChange={onCategoryChange}
      />,
    );

    await user.selectOptions(screen.getByRole('combobox', { name: 'Catégorie' }), 'cat-2');
    expect(onCategoryChange).toHaveBeenCalledWith('cat-2');
  });

  it('calls onClose from the close button and from "Voir les résultats"', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <MobileFilterSheet isOpen onClose={onClose} categories={CATEGORIES} categoryId={null} onCategoryChange={vi.fn()} />,
    );

    await user.click(screen.getByRole('button', { name: 'Fermer les filtres' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    onClose.mockClear();
    render(
      <MobileFilterSheet isOpen onClose={onClose} categories={CATEGORIES} categoryId={null} onCategoryChange={vi.fn()} />,
    );
    await user.click(screen.getAllByRole('button', { name: 'Voir les résultats' })[0]!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
