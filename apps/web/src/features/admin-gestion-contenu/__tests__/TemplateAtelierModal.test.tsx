import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { TemplateAtelierModal } from '../ui/TemplateAtelierModal';
import type { CatalogPageEntry } from '../utils/merge-section-catalog';

const MOCK_PAGES: CatalogPageEntry[] = [
  { page: 'accueil', label: 'Accueil', sections: [] },
  { page: 'a-propos', label: 'À propos', sections: [] },
];

describe('TemplateAtelierModal', () => {
  it('renders modal when open with categories, presets, and live preview', () => {
    const onClose = vi.fn();
    const onAddSection = vi.fn();

    render(
      <TemplateAtelierModal
        isOpen={true}
        onClose={onClose}
        pages={MOCK_PAGES}
        initialPage="accueil"
        onAddSection={onAddSection}
      />,
    );

    expect(screen.getByTestId('template-atelier-modal')).toBeInTheDocument();
    expect(screen.getByText('Atelier de Gabarits & Composants Réutilisables')).toBeInTheDocument();
    expect(screen.getByText('Bandeaux & Hero')).toBeInTheDocument();
    expect(screen.getByText('ÉCLIPSE SOLAIRE')).toBeInTheDocument();
  });

  it('filters presets by category when a category tab is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onAddSection = vi.fn();

    render(
      <TemplateAtelierModal
        isOpen={true}
        onClose={onClose}
        pages={MOCK_PAGES}
        onAddSection={onAddSection}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Éditorial & Savoir-faire' }));
    expect(screen.getByText('Éditorial Double Colonne')).toBeInTheDocument();
  });

  it('calls onAddSection and closes modal when adding section', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onAddSection = vi.fn();

    render(
      <TemplateAtelierModal
        isOpen={true}
        onClose={onClose}
        pages={MOCK_PAGES}
        initialPage="accueil"
        onAddSection={onAddSection}
      />,
    );

    const submitBtn = screen.getByRole('button', { name: /Ajouter la section à la page/i });
    await user.click(submitBtn);

    expect(onAddSection).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 'accueil',
        titleText: 'ÉCLIPSE SOLAIRE',
      }),
    );
    expect(onClose).toHaveBeenCalled();
  });
});
