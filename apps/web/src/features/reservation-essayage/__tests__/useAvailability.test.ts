import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { withQueryClient } from '@/lib/test-utils';

import { useAvailability } from '../hooks/useAvailability';

describe('useAvailability', () => {
  it('loads the month availability days for the given atelier', async () => {
    const { result } = renderHook(() => useAvailability('atelier-1'), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.isLoadingDays).toBe(false));

    expect(result.current.days.length).toBeGreaterThan(0);
  });

  it('loads that day free slots once a date is selected', async () => {
    const { result } = renderHook(() => useAvailability('atelier-1'), { wrapper: withQueryClient() });

    act(() => result.current.selectDate('2026-09-14'));

    expect(result.current.selectedDate).toBe('2026-09-14');
    await waitFor(() => expect(result.current.isLoadingSlots).toBe(false));
    expect(result.current.slots).toEqual(['2026-09-14T09:00:00.000Z', '2026-09-14T09:45:00.000Z']);
  });
});
