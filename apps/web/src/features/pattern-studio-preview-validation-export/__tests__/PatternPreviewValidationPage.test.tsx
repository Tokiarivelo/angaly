import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PatternStatus, type PatternPieceDto, type PatternProjectDto } from '@angaly/types';
import { PatternPreviewValidationPage } from '../ui/PatternPreviewValidationPage';
import { withQueryClient } from '@/lib/test-utils';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client');
// three.js is irrelevant here: the stub just reports the piece names the 3D view would drape.
vi.mock('../ui/Garment3DPanel', () => ({
  Garment3DPanel: ({ pieces }: { pieces: PatternPieceDto[] }) => (
    <div data-testid="garment-3d">{pieces.map((p) => p.name).join('|')}</div>
  ),
}));

const outline = [
  { x: 0, y: 0 },
  { x: 200, y: 0 },
  { x: 200, y: 300 },
  { x: 0, y: 300 },
];
const piece = (id: string, name: string): PatternPieceDto => ({
  id,
  versionId: 'v1',
  name,
  dimensionsJson: { widthMm: 200, heightMm: 300, outlineMm: outline },
  fabricRecommendation: null,
  quantity: 1,
  grainlineJson: { angleDegrees: 90, originX: 100, originY: 150 },
  seamAllowanceCm: 1,
  notchesJson: [],
});

const project = (extra: Partial<PatternProjectDto> = {}): PatternProjectDto =>
  ({
    id: 'proj-1',
    projectRef: 'ANG-PAT-00001',
    customerId: 'c1',
    measurementProfileId: null,
    garmentType: 'ROBE',
    occasion: null,
    style: null,
    cutType: null,
    detailsJson: null,
    inspirationMediaId: 'm1',
    inspirationMediaUrl: 'https://cdn.example/inspo.jpg',
    status: PatternStatus.GENERATED,
    versionsCount: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    currentVersion: {
      id: 'v1',
      projectId: 'proj-1',
      versionNumber: 1,
      changeLabel: null,
      parametersJson: { measurements: { TOUR_POITRINE: 90 } },
      generatedByAI: true,
      reviewedById: null,
      reviewNote: null,
      createdAt: new Date().toISOString(),
      pieces: [piece('a', 'Devant'), piece('b', 'Dos')],
    },
    ...extra,
  }) as PatternProjectDto;

const renderPage = async (data: PatternProjectDto = project()) => {
  vi.mocked(apiClient.get).mockResolvedValue(data);
  render(<PatternPreviewValidationPage projectId="proj-1" />, { wrapper: withQueryClient() });
  await screen.findByRole('tablist', { name: 'Mode de prévisualisation' });
};

describe('PatternPreviewValidationPage — comparison & studio', () => {
  beforeEach(() => vi.clearAllMocks());

  it('compares the 2D view with the inspiration model, side by side', async () => {
    await renderPage();
    expect(screen.queryByTestId('inspiration-panel')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: 'Modèle' }));
    const split = screen.getByTestId('comparison-split');
    expect(within(split).getByTestId('inspiration-panel')).toBeInTheDocument();
    expect(within(split).getByTestId('pattern-piece-svg')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: 'Aucun' }));
    expect(screen.queryByTestId('comparison-split')).not.toBeInTheDocument();
  });

  it('compares the 3D view with the model, then superposes it', async () => {
    await renderPage();
    await userEvent.click(screen.getByRole('tab', { name: '3D sur mannequin' }));
    await userEvent.click(screen.getByRole('button', { name: 'Afficher le modèle d’inspiration' }));
    const split = screen.getByTestId('comparison-split');
    expect(within(split).getByTestId('garment-3d')).toBeInTheDocument();
    expect(within(split).getByTestId('inspiration-panel')).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText('Superposer'));
    expect(screen.getByTestId('comparison-overlay-image')).toHaveAttribute('src', 'https://cdn.example/inspo.jpg');
    expect(screen.queryByTestId('inspiration-panel')).not.toBeInTheDocument();
    expect(screen.getByTestId('garment-3d')).toBeInTheDocument();
  });

  it('shows the live 3D beside the studio, with hand edits applied before saving', async () => {
    await renderPage();
    await userEvent.click(screen.getByRole('tab', { name: 'Atelier de retouche' }));
    await userEvent.click(screen.getByRole('radio', { name: '3D' }));
    const split = screen.getByTestId('comparison-split');
    expect(within(split).getByTestId('pattern-studio-editor')).toBeInTheDocument();
    expect(within(split).getByTestId('garment-3d')).toHaveTextContent('Devant|Dos');

    const name = screen.getByLabelText('Nom de la pièce');
    await userEvent.clear(name);
    await userEvent.type(name, 'Corsage{Enter}');
    await waitFor(() => expect(screen.getByTestId('garment-3d')).toHaveTextContent('Corsage|Dos'));
  });

  it('says so when the project cannot be read instead of showing a sample pattern', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('403'));
    render(<PatternPreviewValidationPage projectId="proj-1" />, { wrapper: withQueryClient() });
    expect(await screen.findByRole('alert')).toHaveTextContent('Projet de patron introuvable');
    expect(screen.queryByRole('tablist', { name: 'Mode de prévisualisation' })).not.toBeInTheDocument();
  });

  it('falls back when the project has no inspiration photo', async () => {
    await renderPage(project({ inspirationMediaUrl: null }));
    expect(screen.getByRole('radio', { name: 'Modèle' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Afficher le modèle d’inspiration' })).not.toBeInTheDocument();
  });

  it('does not compare the 3D view with itself', async () => {
    await renderPage();
    await userEvent.click(screen.getByRole('tab', { name: 'Ensemble' }));
    await userEvent.click(screen.getByRole('radio', { name: '3D' }));
    expect(screen.getByTestId('comparison-split')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: '3D sur mannequin' }));
    expect(screen.queryByTestId('comparison-split')).not.toBeInTheDocument();
    expect(screen.getAllByTestId('garment-3d')).toHaveLength(1);
  });
});
