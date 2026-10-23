import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RealisticRenderDto } from '@angaly/types';
import { RealisticRenderSection } from '../ui/RealisticRenderSection';
import type { GarmentModel } from '../utils/garment3d/garment-model';
import { withQueryClient } from '@/lib/test-utils';
import { apiClient, ApiError } from '@/lib/api-client';

vi.mock('@/lib/api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api-client')>();
  return { ...actual, apiClient: { get: vi.fn(), post: vi.fn() } };
});

// three.js cannot run in jsdom: the viewer is a probe exposing its props.
vi.mock('next/dynamic', () => ({
  default: () =>
    function ViewerProbe(props: { glbUrl: string; pose: { leftArm: { raise: number } }; onError: (m: string) => void }) {
      return (
        <button type="button" data-testid="realistic-probe" data-url={props.glbUrl} data-raise={props.pose.leftArm.raise} onClick={() => props.onError('Le rendu réaliste n’a pas pu être chargé.')}>
          probe
        </button>
      );
    },
}));

const model = {} as GarmentModel;

const dto = (overrides: Partial<RealisticRenderDto> = {}): RealisticRenderDto => ({
  id: 'r1',
  versionId: 'v1',
  pose: 'PRESENTATION',
  status: 'QUEUED',
  glbUrl: null,
  simPose: null,
  error: null,
  durationMs: null,
  cached: false,
  createdAt: '2026-10-16T10:00:00Z',
  finishedAt: null,
  ...overrides,
});

const limb = (raise: number) => ({ raise, forward: 0, twist: 0, bend: 6 });
const done = dto({
  status: 'DONE',
  glbUrl: 'https://cdn/patterns/x.glb',
  simPose: { leftArm: limb(-7.5), rightArm: limb(-7.5), leftLeg: limb(0), rightLeg: limb(0) },
  cached: true,
});

const mount = (presetId = 'PRESENTATION') =>
  render(<RealisticRenderSection versionId="v1" model={model} presetId={presetId} />, { wrapper: withQueryClient() });

describe('RealisticRenderSection', () => {
  beforeEach(() => vi.clearAllMocks());

  it('queues a render and shows its progress', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(null);
    vi.mocked(apiClient.post).mockResolvedValueOnce(dto());
    mount('NEUTRE');

    await userEvent.click(await screen.findByRole('button', { name: /Rendu réaliste/ }));

    expect(await screen.findByText('En file d’attente')).toBeInTheDocument();
    expect(apiClient.post).toHaveBeenCalledWith('/api/pattern-versions/v1/realistic-render', { pose: 'NEUTRE' });
    expect(screen.getByRole('button', { name: /Rendu réaliste/ })).toBeDisabled();
  });

  it('shows a finished render in the simulated pose, and goes back to the preview', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(done);
    mount();

    expect(await screen.findByText(/Rendu réaliste prêt/)).toHaveTextContent('(déjà calculé)');
    expect(screen.queryByTestId('realistic-probe')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Voir le rendu réaliste' }));
    const probe = screen.getByTestId('realistic-probe');
    expect(probe).toHaveAttribute('data-url', 'https://cdn/patterns/x.glb');
    expect(probe).toHaveAttribute('data-raise', '-7.5');

    await userEvent.click(screen.getByRole('button', { name: 'Revenir à l’aperçu' }));
    expect(screen.queryByTestId('realistic-probe')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Relancer le rendu réaliste' })).toBeEnabled();
  });

  it('reports a .glb that cannot be loaded', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(done);
    mount();
    await userEvent.click(await screen.findByRole('button', { name: 'Voir le rendu réaliste' }));
    await userEvent.click(screen.getByTestId('realistic-probe'));
    expect(screen.getByRole('alert')).toHaveTextContent('n’a pas pu être chargé');
  });

  it('shows why a render failed', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(dto({ status: 'FAILED', error: 'Délai de simulation dépassé' }));
    mount();
    expect(await screen.findByText(/Le rendu a échoué : Délai de simulation dépassé/)).toBeInTheDocument();
  });

  it('shows the daily quota error', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(null);
    vi.mocked(apiClient.post).mockRejectedValueOnce(new ApiError('Limite de 10 rendus réalistes par jour atteinte.', 429, 'TOO_MANY_REQUESTS'));
    mount();
    await userEvent.click(await screen.findByRole('button', { name: /Rendu réaliste/ }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Limite de 10 rendus'));
  });

  it('explains that a custom pose is simulated in the presentation pose', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(null);
    mount('CUSTOM');
    expect(await screen.findByText(/pose personnalisée est simulée en pose de présentation/)).toBeInTheDocument();
    await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith('/api/pattern-versions/v1/realistic-render?pose=PRESENTATION'));
  });
});
