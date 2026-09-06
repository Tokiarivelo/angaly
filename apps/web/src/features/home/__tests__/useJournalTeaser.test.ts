import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { withQueryClient } from '@/lib/test-utils';

import { useJournalTeaser } from '../hooks/useJournalTeaser';

describe('useJournalTeaser', () => {
  it('resolves with blog posts from the API', async () => {
    const { result } = renderHook(() => useJournalTeaser(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0]?.slug).toBe('choisir-sa-robe-de-mariee');
  });
});
