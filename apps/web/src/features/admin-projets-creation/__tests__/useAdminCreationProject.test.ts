import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreationProjectStage, Role } from '@angaly/types';
import { useAdminCreationProject } from '../hooks/useAdminCreationProject';
import { withQueryClient } from '@/lib/test-utils';
import { apiClient } from '@/lib/api-client';

let currentSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/projets-creation/p-1',
  useSearchParams: () => currentSearchParams,
}));

vi.mock('@/lib/api-client');

const DETAIL = {
  id: 'p-1',
  reference: 'CRP-2026-K3f9a01x',
  title: 'Robe de mariée',
  description: null,
  stage: CreationProjectStage.PATRON,
  quoteId: null,
  quoteNumber: null,
  creationId: null,
  completedAt: null,
  assignedTo: null,
  stageHistory: [],
  createdAt: '2026-01-14T10:00:00.000Z',
  updatedAt: '2026-01-14T10:00:00.000Z',
};
const STAFF = [{ id: 'u-2', email: 'couturiere@angaly.mg', role: Role.COUTURIERE }];

describe('useAdminCreationProject', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentSearchParams = new URLSearchParams();
    vi.mocked(apiClient.get).mockImplementation((url: string) =>
      Promise.resolve(url.endsWith('/assignees') ? STAFF : DETAIL),
    );
  });

  it('fetches the project detail and the assignable staff', async () => {
    const { result } = renderHook(() => useAdminCreationProject('p-1'), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.project).toEqual(DETAIL));
    await waitFor(() => expect(result.current.assignees).toEqual(STAFF));
    expect(apiClient.get).toHaveBeenCalledWith('/admin/creation-projects/p-1');
    expect(apiClient.get).toHaveBeenCalledWith('/admin/creation-projects/assignees');
  });

  it('assigns a staff member via PATCH /assignee', async () => {
    vi.mocked(apiClient.patch).mockResolvedValueOnce(DETAIL);
    const { result } = renderHook(() => useAdminCreationProject('p-1'), { wrapper: withQueryClient() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.assign('u-2');
    });

    expect(apiClient.patch).toHaveBeenCalledWith('/admin/creation-projects/p-1/assignee', { userId: 'u-2' });
  });

  it('unassigns with a null userId', async () => {
    vi.mocked(apiClient.patch).mockResolvedValueOnce(DETAIL);
    const { result } = renderHook(() => useAdminCreationProject('p-1'), { wrapper: withQueryClient() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.assign(null);
    });

    expect(apiClient.patch).toHaveBeenCalledWith('/admin/creation-projects/p-1/assignee', { userId: null });
  });

  it('updates the stage via PATCH /stage', async () => {
    vi.mocked(apiClient.patch).mockResolvedValueOnce(DETAIL);
    const { result } = renderHook(() => useAdminCreationProject('p-1'), { wrapper: withQueryClient() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.updateStage(CreationProjectStage.CONFECTION);
    });

    expect(apiClient.patch).toHaveBeenCalledWith('/admin/creation-projects/p-1/stage', {
      stage: CreationProjectStage.CONFECTION,
    });
  });

  it('determines the next stage and advances with goToNextStage', async () => {
    vi.mocked(apiClient.patch).mockResolvedValueOnce(DETAIL);
    const { result } = renderHook(() => useAdminCreationProject('p-1'), { wrapper: withQueryClient() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Current stage is PATRON, so next is CONFECTION
    expect(result.current.nextStage).toBe(CreationProjectStage.CONFECTION);

    await act(async () => {
      await result.current.goToNextStage();
    });

    expect(apiClient.patch).toHaveBeenCalledWith('/admin/creation-projects/p-1/stage', {
      stage: CreationProjectStage.CONFECTION,
    });
  });

  it('allows selecting and changing workspace stage', async () => {
    const { result } = renderHook(() => useAdminCreationProject('p-1'), { wrapper: withQueryClient() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Initially defaults to project.stage (PATRON)
    expect(result.current.selectedStage).toBe(CreationProjectStage.PATRON);

    act(() => {
      result.current.setSelectedStage(CreationProjectStage.ESSAYAGE);
    });

    expect(result.current.selectedStage).toBe(CreationProjectStage.ESSAYAGE);
  });

  it('adds a note for a specific stage via POST /notes', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      id: 'note-1',
      stage: CreationProjectStage.PATRON,
      content: 'Toile validée avec aisance 2cm',
    });
    const { result } = renderHook(() => useAdminCreationProject('p-1'), { wrapper: withQueryClient() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.addNote({
        stage: CreationProjectStage.PATRON,
        content: 'Toile validée avec aisance 2cm',
      });
    });

    expect(apiClient.post).toHaveBeenCalledWith('/admin/creation-projects/p-1/notes', {
      stage: CreationProjectStage.PATRON,
      content: 'Toile validée avec aisance 2cm',
    });
  });

  it('deletes a note via DELETE /notes/:noteId', async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useAdminCreationProject('p-1'), { wrapper: withQueryClient() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.deleteNote('note-1');
    });

    expect(apiClient.delete).toHaveBeenCalledWith('/admin/creation-projects/p-1/notes/note-1');
  });

  it('adds media via POST /media', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      id: 'media-1',
      stage: CreationProjectStage.PATRON,
      url: 'https://storage.angaly.mg/creations/patron.pdf',
    });
    const { result } = renderHook(() => useAdminCreationProject('p-1'), { wrapper: withQueryClient() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.addMedia({
        stage: CreationProjectStage.PATRON,
        url: 'https://storage.angaly.mg/creations/patron.pdf',
        title: 'Patron PDF A0',
        fileName: 'patron.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1024,
      });
    });

    expect(apiClient.post).toHaveBeenCalledWith('/admin/creation-projects/p-1/media', {
      stage: CreationProjectStage.PATRON,
      url: 'https://storage.angaly.mg/creations/patron.pdf',
      title: 'Patron PDF A0',
      fileName: 'patron.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1024,
    });
  });

  it('deletes media via DELETE /media/:mediaId', async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useAdminCreationProject('p-1'), { wrapper: withQueryClient() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.deleteMedia('media-1');
    });

    expect(apiClient.delete).toHaveBeenCalledWith('/admin/creation-projects/p-1/media/media-1');
  });

  it('initializes selectedStage from ?step= query parameter', async () => {
    currentSearchParams = new URLSearchParams('step=conception');
    const { result } = renderHook(() => useAdminCreationProject('p-1'), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.selectedStage).toBe(CreationProjectStage.CONCEPTION);
  });

  it('generates an AI pattern via POST /admin/creation-projects/:id/generate-pattern', async () => {
    const patternResponse = {
      pieces: [
        {
          name: 'Corsage Devant',
          outlineMm: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
          seamAllowanceMm: 15,
          grainline: { angleDegrees: 90, originX: 50, originY: 100 },
          notches: [],
          widthMm: 200,
          heightMm: 400,
        },
      ],
      parameters: {
        garmentType: 'ROBE',
        cutType: 'EVASEE',
        details: {},
      },
      measurements: { bust: 88, waist: 70 },
      svgContent: '<svg><g id="pieces"></g></svg>',
      svgDataUri: 'data:image/svg+xml;utf8,<svg></svg>',
    };
    vi.mocked(apiClient.post).mockResolvedValueOnce(patternResponse);

    const { result } = renderHook(() => useAdminCreationProject('p-1'), { wrapper: withQueryClient() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let patternResult;
    await act(async () => {
      patternResult = await result.current.generateAiPattern({
        garmentType: 'ROBE',
        cutType: 'EVASEE',
        style: 'Gala',
        requestAiSuggestion: true,
        saveMedia: true,
        addNote: true,
      });
    });

    expect(apiClient.post).toHaveBeenCalledWith('/admin/creation-projects/p-1/generate-pattern', {
      garmentType: 'ROBE',
      cutType: 'EVASEE',
      style: 'Gala',
      requestAiSuggestion: true,
      saveMedia: true,
      addNote: true,
    });
    expect(patternResult).toEqual(patternResponse);
  });
});

