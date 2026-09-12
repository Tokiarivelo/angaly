import { renderHook, waitFor } from '@testing-library/react';
import { useQuote } from '../hooks/useQuote';
import { withQueryClient } from '@/lib/test-utils';
import { apiClient } from '@/lib/api-client';
import { QuoteStatus } from '@angaly/types';
import { vi, describe, it, expect } from 'vitest';

vi.mock('@/lib/api-client');

const MOCK_QUOTE = {
  id: '1',
  quoteNumber: 'ANG-DEV-123',
  customerId: 'cust-1',
  creationId: null,
  description: 'Robe',
  lineItems: [],
  subtotal: '100.00',
  depositAmount: '50.00',
  balanceAmount: '50.00',
  total: '100.00',
  status: QuoteStatus.SENT,
  validUntil: null,
  estimatedDelayDays: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('useQuote', () => {
  it('should fetch a quote by number', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce(MOCK_QUOTE as any);

    const { result } = renderHook(() => useQuote('ANG-DEV-123'), { wrapper: withQueryClient() });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(MOCK_QUOTE);
    expect(apiClient.get).toHaveBeenCalledWith('/api/quotes/ANG-DEV-123');
  });
});
