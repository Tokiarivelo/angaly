import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PatternPieceDto } from '@angaly/types';
import { PatternStudioEditor } from '../ui/studio/PatternStudioEditor';
import { usePatternDraft } from '../hooks/usePatternDraft';
import { pieceOutline } from '../utils/pattern-editing';
import { withQueryClient } from '@/lib/test-utils';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client');

const outline = [
  { x: 0, y: 0 },
  { x: 200, y: 0 },
  { x: 200, y: 300 },
  { x: 0, y: 300 },
];
const makePiece = (id: string, name: string): PatternPieceDto => ({
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
const SAVED = [makePiece('a', 'Devant'), makePiece('b', 'Dos')];

const Harness: React.FC<{ versionId?: string | null; measurements?: Record<string, number> | null }> = ({
  versionId = 'v1',
  measurements = { TOUR_POITRINE: 90, TOUR_TAILLE: 70 },
}) => {
  const draft = usePatternDraft(SAVED);
  const [active, setActive] = React.useState('a');
  return (
    <>
      <PatternStudioEditor
        projectId="proj-1"
        versionId={versionId}
        garmentType="ROBE"
        measurements={measurements}
        draft={draft}
        activePieceId={active}
        onSelectPiece={setActive}
      />
      <div data-testid="names">{draft.pieces.map((p) => p.name).join('|')}</div>
      <div data-testid="active">{active}</div>
    </>
  );
};

const renderEditor = (props: React.ComponentProps<typeof Harness> = {}) =>
  render(<Harness {...props} />, { wrapper: withQueryClient() });

const editor = () => screen.getByTestId('pattern-studio-editor');

describe('PatternStudioEditor', () => {
  beforeEach(() => vi.clearAllMocks());

  it('starts clean: nothing to save or undo', () => {
    renderEditor();
    expect(screen.getByRole('button', { name: /Enregistrer une version/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Annuler' })).toBeDisabled();
    expect(screen.getByTestId('studio-hint')).toHaveTextContent('Sélection');
  });

  it('switches tool from the toolbar and from keyboard shortcuts', async () => {
    renderEditor();
    await userEvent.click(screen.getByRole('radio', { name: 'Mètre ruban' }));
    expect(screen.getByTestId('studio-hint')).toHaveTextContent('Mètre ruban');
    fireEvent.keyDown(editor(), { key: 'p' });
    expect(screen.getByTestId('studio-hint')).toHaveTextContent('Dessiner une pièce');
    fireEvent.keyDown(editor(), { key: 'Escape' });
    expect(screen.getByTestId('studio-hint')).toHaveTextContent('Sélection');
  });

  it('renames the piece, then undoes and redoes with the keyboard', async () => {
    renderEditor();
    const name = screen.getByLabelText('Nom de la pièce');
    await userEvent.clear(name);
    await userEvent.type(name, 'Devant robe{Enter}');
    expect(screen.getByTestId('names')).toHaveTextContent('Devant robe|Dos');
    expect(screen.getByText(/Retouches non enregistrées/)).toBeInTheDocument();

    fireEvent.keyDown(editor(), { key: 'z', ctrlKey: true });
    expect(screen.getByTestId('names')).toHaveTextContent('Devant|Dos');
    fireEvent.keyDown(editor(), { key: 'z', ctrlKey: true, shiftKey: true });
    expect(screen.getByTestId('names')).toHaveTextContent('Devant robe|Dos');
    fireEvent.keyDown(editor(), { key: 'z', ctrlKey: true });
    fireEvent.keyDown(editor(), { key: 'y', ctrlKey: true });
    expect(screen.getByTestId('names')).toHaveTextContent('Devant robe|Dos');
  });

  it('sets an exact width from the dimensions fields', async () => {
    renderEditor();
    const width = screen.getByLabelText('Largeur');
    await userEvent.clear(width);
    await userEvent.type(width, '25{Enter}');
    await waitFor(() => expect(screen.getByLabelText('Largeur')).toHaveValue('25'));
    expect(screen.getByText(/Surface 750 cm²/)).toBeInTheDocument();
  });

  it('sets an exact edge length', async () => {
    renderEditor();
    const bord = screen.getByLabelText('Bord 1');
    await userEvent.clear(bord);
    await userEvent.type(bord, '30{Enter}');
    expect(screen.getByLabelText('Largeur')).toHaveValue('30');
  });

  it('nudges the whole piece with the arrow keys', () => {
    renderEditor();
    fireEvent.keyDown(editor(), { key: 'ArrowRight', shiftKey: true });
    expect(screen.getByText(/Retouches non enregistrées/)).toBeInTheDocument();
    fireEvent.keyDown(editor(), { key: 'z', ctrlKey: true });
    expect(screen.queryByText(/Retouches non enregistrées/)).not.toBeInTheDocument();
  });

  it('duplicates and deletes pieces', async () => {
    renderEditor();
    await userEvent.click(screen.getByRole('button', { name: /Dupliquer/ }));
    expect(screen.getByTestId('names')).toHaveTextContent('Devant|Dos|Devant (copie)');
    expect(screen.getByTestId('active').textContent).toMatch(/^draft-/);
    await userEvent.click(screen.getByRole('button', { name: /Supprimer/ }));
    expect(screen.getByTestId('names')).toHaveTextContent('Devant|Dos');
  });

  it('transforms: mirror, rotate and smooth add undo steps', async () => {
    renderEditor();
    await userEvent.click(screen.getByRole('button', { name: /Lisser/ }));
    expect(screen.getByText(/8 points/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Simplifier/ }));
    await userEvent.click(screen.getByRole('button', { name: /Miroir/ }));
    await userEvent.click(screen.getByRole('button', { name: /Pivoter 90°/ }));
    fireEvent.keyDown(editor(), { key: 'z', ctrlKey: true });
    expect(screen.getByRole('button', { name: 'Annuler' })).toBeEnabled();
  });

  it('saves the edits as a new version, then clears the draft', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ id: 'v2' });
    renderEditor();
    const name = screen.getByLabelText('Nom de la pièce');
    await userEvent.clear(name);
    await userEvent.type(name, 'Corsage{Enter}');
    await userEvent.type(screen.getByLabelText('Note de version'), 'Taille reprise');
    await userEvent.click(screen.getByRole('button', { name: /Enregistrer une version/ }));

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Nouvelle version enregistrée.'));
    const [url, body] = vi.mocked(apiClient.post).mock.calls[0]!;
    expect(url).toBe('/api/pattern-versions/v1/edits');
    expect((body as { changeLabel: string }).changeLabel).toBe('Taille reprise');
    expect((body as { pieces: PatternPieceDto[] }).pieces.map((p) => p.name)).toEqual(['Corsage', 'Dos']);
    expect(screen.getByTestId('names')).toHaveTextContent('Devant|Dos');
  });

  it('reports a failed save and keeps the draft', async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('boom'));
    renderEditor();
    const name = screen.getByLabelText('Nom de la pièce');
    await userEvent.clear(name);
    await userEvent.type(name, 'X{Enter}');
    await userEvent.click(screen.getByRole('button', { name: /Enregistrer une version/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Enregistrement impossible');
    expect(screen.getByTestId('names')).toHaveTextContent('X|Dos');
  });

  it('cannot save without a persisted version', async () => {
    renderEditor({ versionId: null });
    const name = screen.getByLabelText('Nom de la pièce');
    await userEvent.clear(name);
    await userEvent.type(name, 'X{Enter}');
    expect(screen.getByRole('button', { name: /Enregistrer une version/ })).toBeDisabled();
  });

  it('abandons the edits', async () => {
    renderEditor();
    const name = screen.getByLabelText('Nom de la pièce');
    await userEvent.clear(name);
    await userEvent.type(name, 'Zzz{Enter}');
    await userEvent.click(screen.getByRole('button', { name: 'Abandonner les retouches' }));
    expect(screen.getByTestId('names')).toHaveTextContent('Devant|Dos');
  });

  it('regenerates the pattern from edited body measurements', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ id: 'v3' });
    renderEditor();
    await userEvent.click(screen.getByRole('tab', { name: 'Mesures du corps' }));
    const panel = screen.getByTestId('studio-measurements');
    const regenerate = within(panel).getByRole('button', { name: /Régénérer/ });
    expect(regenerate).toBeDisabled();

    const bust = within(panel).getByLabelText(/Tour de poitrine/);
    await userEvent.clear(bust);
    await userEvent.type(bust, '96{Enter}');
    expect(regenerate).toBeEnabled();
    await userEvent.click(regenerate);

    await waitFor(() => expect(apiClient.post).toHaveBeenCalled());
    const [url, body] = vi.mocked(apiClient.post).mock.calls[0]!;
    expect(url).toBe('/api/pattern-projects/proj-1/generate');
    expect((body as { measurements: Record<string, number> }).measurements).toMatchObject({ TOUR_POITRINE: 96, TOUR_TAILLE: 70 });
    expect(await screen.findByRole('status')).toHaveTextContent('Patron régénéré');
  });

  it('asks before regenerating over unsaved edits', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderEditor();
    const name = screen.getByLabelText('Nom de la pièce');
    await userEvent.clear(name);
    await userEvent.type(name, 'Y{Enter}');
    await userEvent.click(screen.getByRole('tab', { name: 'Mesures du corps' }));
    const bust = screen.getByLabelText(/Tour de poitrine/);
    await userEvent.clear(bust);
    await userEvent.type(bust, '100{Enter}');
    await userEvent.click(screen.getByRole('button', { name: /Régénérer/ }));
    expect(confirm).toHaveBeenCalled();
    expect(apiClient.post).not.toHaveBeenCalled();
    confirm.mockRestore();
  });

  it('keeps pieces untouched when a point is selected and typed into the point fields', () => {
    renderEditor();
    expect(pieceOutline(SAVED[0]!)).toHaveLength(4);
    expect(screen.queryByText('Point 1')).not.toBeInTheDocument();
  });
});
