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
  media: null,
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

    // The preview is open by default.
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

  it('shows the current image and lets the editor clear it (mediaId sent as null)', async () => {
    const onSaveDraft = vi.fn();
    const user = userEvent.setup();
    const withImage = { ...SECTION, mediaId: 'media-1', media: { id: 'media-1', url: 'https://cdn.example/hero.jpg', altText: 'Robe' } };
    render(<SectionEditorForm {...BASE_PROPS} section={withImage} onSaveDraft={onSaveDraft} />);

    expect(screen.getByRole('button', { name: 'Remplacer l’image' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retirer l’image' }));
    await user.click(screen.getByRole('button', { name: 'Enregistrer comme brouillon' }));

    expect(onSaveDraft).toHaveBeenCalledWith(expect.objectContaining({ mediaId: null }));
  });

  it('sends the structured dataJson (e.g. the hero eyebrow) back on save so it is never wiped', async () => {
    const onSaveDraft = vi.fn();
    const user = userEvent.setup();
    render(
      <SectionEditorForm {...BASE_PROPS} section={{ ...SECTION, dataJson: { eyebrow: 'MAISON', extra: 1 } }} onSaveDraft={onSaveDraft} />,
    );

    expect(screen.getByLabelText('Sur-titre (eyebrow)')).toHaveValue('MAISON');
    await user.click(screen.getByRole('button', { name: 'Enregistrer comme brouillon' }));

    expect(onSaveDraft).toHaveBeenCalledWith(expect.objectContaining({ dataJson: { eyebrow: 'MAISON', extra: 1 } }));
  });

  it('falls back to every text field plus a raw JSON box for a section the catalogue does not describe', async () => {
    const onSaveDraft = vi.fn();
    const user = userEvent.setup();
    render(
      <SectionEditorForm
        {...BASE_PROPS}
        sectionKey="footer"
        section={{ ...SECTION, sectionKey: 'footer', dataJson: { columns: 3 } }}
        onSaveDraft={onSaveDraft}
      />,
    );

    expect(screen.getByLabelText('Bouton secondaire')).toBeInTheDocument();
    expect(screen.getByLabelText('Données avancées (JSON)')).toHaveValue(JSON.stringify({ columns: 3 }, null, 2));

    await user.click(screen.getByRole('button', { name: 'Enregistrer comme brouillon' }));
    expect(onSaveDraft).toHaveBeenCalledWith(expect.objectContaining({ dataJson: { columns: 3 } }));
  });

  it('blocks saving invalid raw JSON and shows an error', async () => {
    const onSaveDraft = vi.fn();
    const user = userEvent.setup();
    render(<SectionEditorForm {...BASE_PROPS} sectionKey="footer" section={{ ...SECTION, sectionKey: 'footer' }} onSaveDraft={onSaveDraft} />);

    await user.type(screen.getByLabelText('Données avancées (JSON)'), '{{ nope');
    await user.click(screen.getByRole('button', { name: 'Enregistrer comme brouillon' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('JSON invalide');
    expect(onSaveDraft).not.toHaveBeenCalled();
  });

  it('previews image, eyebrow and CTAs live, and offers a link to the published page', () => {
    render(
      <SectionEditorForm
        {...BASE_PROPS}
        section={{
          ...SECTION,
          ctaPrimaryLabel: 'Prendre rendez-vous',
          dataJson: { eyebrow: 'MAISON DE COUTURE' },
          media: { id: 'm', url: 'https://cdn.example/hero.jpg', altText: 'Robe' },
          mediaId: 'm',
        }}
      />,
    );

    const preview = screen.getByTestId('section-preview');
    expect(preview).toHaveTextContent('MAISON DE COUTURE');
    expect(preview).toHaveTextContent('Prendre rendez-vous');
    expect(screen.getByRole('link', { name: /Voir la page publiée/ })).toHaveAttribute('href', '/');
  });

  describe('translation (Malagasy) over a French base', () => {
    const BASE_WITH_IMAGE = {
      ...SECTION,
      titleText: 'Bienvenue',
      mediaId: 'media-1',
      media: { id: 'media-1', url: 'https://cdn.example/hero.jpg', altText: 'Robe' },
    };
    const MG_SECTION = { ...SECTION, id: 'section-mg', locale: Locale.MG, titleText: 'Tongasoa', mediaId: null, media: null };

    it('shows the French image read-only and shows the French text as placeholder', () => {
      render(<SectionEditorForm {...BASE_PROPS} activeLocale={Locale.MG} section={MG_SECTION} baseSection={BASE_WITH_IMAGE} />);

      expect(screen.getByText(/Image partagée avec le français/)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Choisir une image|Remplacer l’image/ })).not.toBeInTheDocument();
      expect(screen.getByLabelText('Titre')).toHaveValue('Tongasoa');
      expect(screen.getByLabelText('Sous-titre')).toHaveAttribute('placeholder', 'Sous-titre');
    });

    it('never saves an image for a translation (mediaId null)', async () => {
      const onSaveDraft = vi.fn();
      const user = userEvent.setup();
      render(
        <SectionEditorForm {...BASE_PROPS} activeLocale={Locale.MG} section={MG_SECTION} baseSection={BASE_WITH_IMAGE} onSaveDraft={onSaveDraft} />,
      );

      await user.click(screen.getByRole('button', { name: 'Enregistrer comme brouillon' }));

      expect(onSaveDraft).toHaveBeenCalledWith(expect.objectContaining({ mediaId: null }));
    });

    it('previews the translation with the French image and French fallback text for blank fields', () => {
      render(
        <SectionEditorForm
          {...BASE_PROPS}
          activeLocale={Locale.MG}
          section={{ ...MG_SECTION, titleText: '', subtitleText: null }}
          baseSection={{ ...BASE_WITH_IMAGE, subtitleText: 'Sous-titre FR' }}
        />,
      );

      const preview = screen.getByTestId('section-preview');
      expect(preview).toHaveTextContent('Bienvenue');
      expect(preview).toHaveTextContent('Sous-titre FR');
      expect(preview.querySelector('img')).not.toBeNull();
    });
  });
});
