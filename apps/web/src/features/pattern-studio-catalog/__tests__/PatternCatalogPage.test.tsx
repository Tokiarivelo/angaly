import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import type { PatternCatalogEntryDto } from '@angaly/types';

const hook = vi.hoisted(() => ({ value: {} as Record<string, unknown> }));
vi.mock('../hooks/usePatternCatalog', () => ({ usePatternCatalog: () => hook.value }));

import { PatternCatalogPage } from '../ui/PatternCatalogPage';
import { CatalogCard } from '../ui/CatalogCard';

const tournure: PatternCatalogEntryDto = {
  id: 'tournure-1885',
  title: 'Robe à tournure en lés',
  era: '1883–1888',
  notes: 'Pouf sur tournure, basque à pointes.',
  group: 'HISTORIQUE',
  garmentType: 'ROBE',
  pieceCount: 23,
  yardageM: 3,
  pieces: [{ name: 'Drapé de tournure (pouf)', quantity: 1 }],
  imageUrl: 'http://localhost:9000/pattern-inspirations/x.jpg',
  credit: { title: 'Dress', date: 'ca. 1885', source: 'The Met', page: 'https://www.metmuseum.org/x', license: 'CC0 (The Met Open Access)' },
};
const qipao: PatternCatalogEntryDto = { ...tournure, id: 'qipao', title: 'Qipao (cheongsam)', group: 'MODERNE', era: 'Shanghai', imageUrl: null, credit: null, yardageM: null };

const base = () => ({
  isLoading: false,
  isError: false,
  entries: [tournure, qipao],
  visible: [tournure, qipao],
  counts: { TOUS: 2, MODERNE: 1, HISTORIQUE: 1, MARIEE: 0 },
  filter: 'TOUS',
  setFilter: vi.fn(),
  search: '',
  setSearch: vi.fn(),
  openPieces: null,
  showPieces: vi.fn(),
  createFrom: vi.fn(),
  creatingId: null,
  createError: false,
});

describe('PatternCatalogPage', () => {
  beforeEach(() => {
    hook.value = base();
  });

  it('shows each dress with its inspiration photo, period, pieces, yardage and credit', () => {
    render(<PatternCatalogPage />);
    expect(screen.getByRole('heading', { name: 'Catalogue des patrons' })).toBeInTheDocument();
    const card = screen.getByTestId('catalog-card-tournure-1885');
    expect(within(card).getByRole('img')).toHaveAttribute('src', tournure.imageUrl);
    expect(within(card).getByText('1883–1888')).toBeInTheDocument();
    expect(within(card).getByText('23 pièces')).toBeInTheDocument();
    expect(within(card).getByText('3,00 m')).toBeInTheDocument();
    expect(within(card).getByRole('link', { name: 'The Met' })).toHaveAttribute('href', 'https://www.metmuseum.org/x');
    expect(within(screen.getByTestId('catalog-card-qipao')).getByText('Photo d’inspiration à venir')).toBeInTheDocument();
  });

  it('filters by shelf, searches, opens the pieces and creates a project', () => {
    const v = base();
    hook.value = v;
    render(<PatternCatalogPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Historiques (1)' }));
    expect(v.setFilter).toHaveBeenCalledWith('HISTORIQUE');
    fireEvent.change(screen.getByPlaceholderText('Rechercher un modèle'), { target: { value: 'pouf' } });
    expect(v.setSearch).toHaveBeenCalledWith('pouf');
    fireEvent.click(within(screen.getByTestId('catalog-card-tournure-1885')).getByText('Voir les pièces'));
    expect(v.showPieces).toHaveBeenCalledWith('tournure-1885');
    fireEvent.click(within(screen.getByTestId('catalog-card-qipao')).getByText('Créer ce patron'));
    expect(v.createFrom).toHaveBeenCalledWith('qipao');
  });

  it('lists a dress’s pieces in a dialog, and shows loading, empty and error states', () => {
    hook.value = { ...base(), openPieces: tournure };
    const { unmount } = render(<PatternCatalogPage />);
    expect(screen.getByRole('dialog')).toHaveTextContent('Drapé de tournure (pouf)');
    fireEvent.click(screen.getByLabelText('Fermer'));
    expect((hook.value as { showPieces: ReturnType<typeof vi.fn> }).showPieces).toHaveBeenCalledWith(null);
    unmount();
    hook.value = { ...base(), visible: [] };
    const second = render(<PatternCatalogPage />);
    expect(screen.getByText('Aucun modèle ne correspond à votre recherche.')).toBeInTheDocument();
    second.unmount();
    hook.value = { ...base(), isError: true, createError: true };
    render(<PatternCatalogPage />);
    expect(screen.getByText('Le catalogue ne peut pas être chargé pour le moment.')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});

describe('CatalogCard', () => {
  it('falls back to a placeholder when the photo fails, and shows the creation in progress', () => {
    render(<CatalogCard entry={tournure} creating onCreate={vi.fn()} onShowPieces={vi.fn()} />);
    fireEvent.error(screen.getByRole('img'));
    expect(screen.getByText('Photo d’inspiration à venir')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Création…/ })).toBeDisabled();
  });
});
