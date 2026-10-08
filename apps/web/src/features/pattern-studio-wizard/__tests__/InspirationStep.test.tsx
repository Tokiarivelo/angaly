import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { InspirationStep } from '../ui/steps/InspirationStep';

const reanalyze = vi.hoisted(() => vi.fn());
vi.mock('../hooks/useUploadInspirationPhoto', () => ({
  useUploadInspirationPhoto: () => ({
    uploadAndAnalyze: vi.fn(),
    reanalyze,
    isUploading: false,
    isAnalyzing: false,
    error: null,
  }),
}));

const profile = {
  isGarment: true,
  garmentType: 'ROBE_MARIEE',
  occasion: 'MARIAGE',
  style: 'GLAMOUR',
  cutType: 'SIRENE',
  details: { manches: 'SANS_MANCHES', longueur: 'SOL' },
};

describe('InspirationStep', () => {
  it('shows the full garment sheet under the preview', () => {
    render(
      <InspirationStep
        inspirationImageUrl="https://cdn/p.jpg"
        detectedFeatures={{ silhouette: 'ajustée', tissu: 'tulle' }}
        isGarment
        profile={profile}
        onInspirationProcessed={vi.fn()}
      />,
    );

    const sheet = screen.getByRole('region', { name: 'Fiche du vêtement' });
    expect(within(sheet).getByText('Robe de mariée')).toBeInTheDocument();
    expect(within(sheet).getByText('Mariage')).toBeInTheDocument();
    expect(within(sheet).getByText('Glamour & Spectaculaire')).toBeInTheDocument();
    expect(within(sheet).getByText('Sirène')).toBeInTheDocument();
    expect(within(sheet).getByText('Sans manches')).toBeInTheDocument();
    expect(within(sheet).getByText('Longueur sol')).toBeInTheDocument();
    expect(within(sheet).getByText(/Silhouette :/)).toBeInTheDocument();
    expect(within(sheet).getByText(/tulle/)).toBeInTheDocument();
  });

  it('shows a warning and no sheet when the photo is not a garment', () => {
    render(
      <InspirationStep
        inspirationImageUrl="https://cdn/p.jpg"
        isGarment={false}
        profile={{ ...profile, isGarment: false }}
        onInspirationProcessed={vi.fn()}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(/ne semble pas représenter un vêtement/);
    expect(screen.queryByRole('region', { name: 'Fiche du vêtement' })).toBeNull();
  });

  it('tells the customer when the analysis could not run', () => {
    render(<InspirationStep inspirationImageUrl="https://cdn/p.jpg" onInspirationProcessed={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent(/L’analyse IA n’a pas pu être réalisée/);
  });

  it('lets the customer retry the analysis on the uploaded photo', () => {
    render(
      <InspirationStep
        inspirationImageUrl="https://cdn/p.jpg"
        inspirationMediaId="media-1"
        onInspirationProcessed={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer l’analyse IA' }));
    expect(reanalyze).toHaveBeenCalledWith('media-1', 'https://cdn/p.jpg');
  });

  it('offers to regenerate once the photo was analysed', () => {
    render(
      <InspirationStep
        inspirationImageUrl="https://cdn/p.jpg"
        inspirationMediaId="media-1"
        isGarment
        profile={profile}
        onInspirationProcessed={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Relancer l’analyse IA' })).toBeInTheDocument();
  });

  it('shows how to build the garment: draping on a mannequin, presentation and advice', () => {
    render(
      <InspirationStep
        inspirationImageUrl="https://cdn/p.jpg"
        isGarment
        profile={{
          ...profile,
          constructionMethod: 'MIXED',
          presentation: 'MANNEQUIN',
          constructionNotes: 'Traîne à draper sur mannequin.',
        }}
        onInspirationProcessed={vi.fn()}
      />,
    );
    const sheet = screen.getByRole('region', { name: 'Fiche du vêtement' });
    expect(within(sheet).getByText('Mixte : base à plat + drapé sur mannequin')).toBeInTheDocument();
    expect(within(sheet).getByText('Sur mannequin')).toBeInTheDocument();
    expect(within(sheet).getByRole('note')).toHaveTextContent('Traîne à draper sur mannequin.');
  });
});
