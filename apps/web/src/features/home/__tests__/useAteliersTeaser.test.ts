import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { withQueryClient } from '@/lib/test-utils';

import { useAteliersTeaser } from '../hooks/useAteliersTeaser';

describe('useAteliersTeaser', () => {
  it('resolves with ateliers from the API, capped at 3', async () => {
    const { result } = renderHook(() => useAteliersTeaser(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.data.length).toBeLessThanOrEqual(3);
    expect(result.current.data[0]?.slug).toBe('antananarivo-centre');
  });
});
