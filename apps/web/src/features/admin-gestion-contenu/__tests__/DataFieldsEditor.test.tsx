import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { DataFieldDefinition } from '../consts/section-catalog.const';
import { DataFieldsEditor } from '../ui/DataFieldsEditor';

const FIELDS: readonly DataFieldDefinition[] = [
  { kind: 'text', key: 'eyebrow', label: 'Sur-titre' },
  {
    kind: 'list',
    key: 'chronology',
    label: 'Chronologie',
    itemLabel: 'Étape',
    itemFields: [
      { key: 'year', label: 'Année', type: 'text' },
      { key: 'title', label: 'Titre', type: 'text' },
    ],
  },
];

describe('DataFieldsEditor', () => {
  it('edits a single text key while preserving keys it does not describe', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<DataFieldsEditor fields={FIELDS} value={{ eyebrow: 'A', other: 42 }} onChange={onChange} />);

    await user.type(screen.getByLabelText('Sur-titre'), 'B');

    expect(onChange).toHaveBeenLastCalledWith({ eyebrow: 'AB', other: 42 });
  });

  it('adds an empty list item', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<DataFieldsEditor fields={FIELDS} value={{ chronology: [] }} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /Ajouter — étape/ }));

    expect(onChange).toHaveBeenCalledWith({ chronology: [{ year: '', title: '' }] });
  });

  it('removes and reorders list items', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const items = [
      { year: '2010', title: 'A' },
      { year: '2020', title: 'B' },
    ];
    render(<DataFieldsEditor fields={FIELDS} value={{ chronology: items }} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Supprimer Étape 1' }));
    expect(onChange).toHaveBeenLastCalledWith({ chronology: [items[1]] });

    await user.click(screen.getByRole('button', { name: 'Descendre Étape 1' }));
    expect(onChange).toHaveBeenLastCalledWith({ chronology: [items[1], items[0]] });
  });

  it('edits a field of one list item', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<DataFieldsEditor fields={FIELDS} value={{ chronology: [{ year: '2010', title: 'A' }] }} onChange={onChange} />);

    await user.type(screen.getByLabelText('Titre'), 'x');

    expect(onChange).toHaveBeenLastCalledWith({ chronology: [{ year: '2010', title: 'Ax' }] });
  });

  describe('translation mode (baseValue given)', () => {
    const IMAGE_FIELDS: readonly DataFieldDefinition[] = [
      {
        kind: 'list',
        key: 'items',
        label: 'Tuiles',
        itemLabel: 'Tuile',
        itemFields: [
          { key: 'label', label: 'Libellé', type: 'text' },
          { key: 'imageUrl', label: 'Image', type: 'image', nullable: true },
        ],
      },
    ];
    const BASE = { items: [{ label: 'Mariage', imageUrl: 'https://cdn/a.jpg' }, { label: 'Costumes', imageUrl: 'https://cdn/b.jpg' }] };

    it('locks the list structure: no add / remove / reorder controls', () => {
      render(<DataFieldsEditor fields={IMAGE_FIELDS} value={{}} baseValue={BASE} onChange={vi.fn()} />);

      expect(screen.queryByRole('button', { name: /Ajouter/ })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Supprimer/ })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Monter|Descendre/ })).not.toBeInTheDocument();
    });

    it('mirrors the base list (one row per base item), showing base copy as placeholder and images as read-only', () => {
      render(<DataFieldsEditor fields={IMAGE_FIELDS} value={{}} baseValue={BASE} onChange={vi.fn()} />);

      expect(screen.getAllByLabelText('Libellé')).toHaveLength(2);
      expect(screen.getAllByLabelText('Libellé')[0]).toHaveAttribute('placeholder', 'Mariage');
      expect(screen.queryByPlaceholderText('URL de l’image')).not.toBeInTheDocument();
      expect(screen.getAllByText(/Image partagée avec le français/)).toHaveLength(2);
    });

    it('stores only translated copy (never images) for every row when a label is typed', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<DataFieldsEditor fields={IMAGE_FIELDS} value={{}} baseValue={BASE} onChange={onChange} />);

      await user.type(screen.getAllByLabelText('Libellé')[0]!, 'F');

      expect(onChange).toHaveBeenLastCalledWith({ items: [{ label: 'F' }, {}] });
    });
  });
});
