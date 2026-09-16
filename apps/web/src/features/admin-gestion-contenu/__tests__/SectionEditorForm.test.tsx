import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ContentStatus, Locale } from '@angaly/types';

import type { PageSectionDto } from '../api/page-sections.api';
import { SectionEditorForm } from '../ui/SectionEditorForm';

const SECTION: PageSectionDto = {
  id: 'section-1',
  page: 'accueil',
  sectionKey: 'hero',
  locale: Locale.FR,
  titleText: 'Bienvenue',
  subtitleText: 'Sous-titre',
  bodyText: null,
  ctaPrimaryLabel: null,
  ctaSecondaryLabel: null,
  dataJson: null,
  mediaId: null,
  status: ContentStatus.DRAFT,
  updatedById: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const BASE_PROPS = {
  page: 'accueil',
  sectionKey: 'hero',
  activeLocale: Locale.FR,
  onLocaleChange: vi.fn(),
  availableLocales: [Locale.FR],
  isLoading: false,
  onSaveDraft: vi.fn(),
  isSaving: false,
  onPublish: vi.fn(),
  isPublishing: false,
  onShowHistory: vi.fn(),
};

describe('SectionEditorForm', () => {
  it('renders the section fields pre-filled from the loaded section', () => {
    render(<SectionEditorForm {...BASE_PROPS} section={SECTION} />);

    expect(screen.getByLabelText('Titre')).toHaveValue('Bienvenue');
    expect(screen.getByLabelText('Sous-titre')).toHaveValue('Sous-titre');
  });

  it('reflects title/subtitle edits in the live preview', async () => {
    const user = userEvent.setup();
    render(<SectionEditorForm {...BASE_PROPS} section={SECTION} />);

    await user.click(screen.getByRole('button', { name: 'Aperçu' }));
    expect(screen.getByText('Bienvenue', { selector: 'p' })).toBeInTheDocument();

    await user.clear(screen.getByLabelText('Titre'));
    await user.type(screen.getByLabelText('Titre'), 'Nouveau titre');

    expect(screen.getByText('Nouveau titre')).toBeInTheDocument();
  });

  it('reports dirty state once a field is edited', async () => {
    const onDirtyChange = vi.fn();
    const user = userEvent.setup();
    render(<SectionEditorForm {...BASE_PROPS} section={SECTION} onDirtyChange={onDirtyChange} />);

    onDirtyChange.mockClear();
    await user.type(screen.getByLabelText('Titre'), '!');

    expect(onDirtyChange).toHaveBeenCalledWith(true);
  });

  it('disables Publier with an explanation when no section has been saved yet', () => {
    render(<SectionEditorForm {...BASE_PROPS} section={null} />);

    const publishButton = screen.getByRole('button', { name: 'Publier les modifications' });
    expect(publishButton).toBeDisabled();
    expect(publishButton).toHaveAttribute('aria-describedby', 'publish-disabled-hint');
    expect(screen.getByText('Enregistrez un brouillon avant de publier.')).toBeInTheDocument();
  });

  it('calls onShowHistory when the history link is clicked', async () => {
    const onShowHistory = vi.fn();
    const user = userEvent.setup();
    render(<SectionEditorForm {...BASE_PROPS} section={SECTION} onShowHistory={onShowHistory} />);

    await user.click(screen.getByRole('button', { name: "Voir l'historique des versions" }));

    expect(onShowHistory).toHaveBeenCalled();
  });
});
