import { renderHook, act, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePatternDraft } from '../hooks/usePatternDraft';
import { useSaveDraft } from '../hooks/useSaveDraft';
import { withOutline } from '../utils/pattern-editing';
import { withQueryClient } from '@/lib/test-utils';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client');

const piece = withOutline(
  { id: 'a', versionId: 'v1', name: 'Devant', dimensionsJson: {}, fabricRecommendation: null, quantity: 1, grainlineJson: null, seamAllowanceCm: 1, notchesJson: [] },
  [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
    { x: 0, y: 100 },
  ],
);
const bowtie = [
  { x: 0, y: 0 },
  { x: 100, y: 100 },
  { x: 100, y: 0 },
  { x: 0, y: 100 },
];

const setup = (versionId: string | null = 'v1') =>
  renderHook(
    () => {
      const draft = usePatternDraft([piece]);
      return { draft, save: useSaveDraft('proj', versionId, draft) };
    },
    { wrapper: withQueryClient() },
  );

describe('useSaveDraft', () => {
  beforeEach(() => vi.clearAllMocks());

  it('cannot save a clean draft or without a version', () => {
    const { result } = setup(null);
    expect(result.current.save.canSave).toBe(false);
    act(() => result.current.draft.commit((ps) => ps.map((p) => ({ ...p, name: 'X' }))));
    expect(result.current.save.canSave).toBe(false);
    act(() => result.current.save.submit());
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('refuses an outline that crosses itself', () => {
    const { result } = setup();
    act(() => result.current.draft.commit((ps) => ps.map((p) => withOutline(p, bowtie))));
    act(() => result.current.save.submit());
    expect(result.current.save.message).toEqual({ kind: 'error', text: 'Contour croisé : Devant.' });
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('saves a new version, then clears the draft', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ id: 'v2' });
    const { result } = setup();
    act(() => result.current.draft.commit((ps) => ps.map((p) => ({ ...p, name: 'Devant repris' }))));
    expect(result.current.save.canSave).toBe(true);
    const onSaved = vi.fn();
    act(() => result.current.save.submit(' Taille ', onSaved));
    await waitFor(() => expect(result.current.save.message?.kind).toBe('ok'));
    expect(apiClient.post).toHaveBeenCalledWith('/api/pattern-versions/v1/edits', expect.objectContaining({ changeLabel: 'Taille' }));
    expect(onSaved).toHaveBeenCalled();
    expect(result.current.draft.dirty).toBe(false);
  });

  it('says when saving failed', async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('boom'));
    const { result } = setup();
    act(() => result.current.draft.commit((ps) => ps.map((p) => ({ ...p, name: 'B' }))));
    act(() => result.current.save.submit());
    await waitFor(() => expect(result.current.save.message?.kind).toBe('error'));
    expect(result.current.draft.dirty).toBe(true);
  });
});
