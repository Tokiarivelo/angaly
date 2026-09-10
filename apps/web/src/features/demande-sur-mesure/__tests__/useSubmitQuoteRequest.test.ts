import { renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { SAMPLE_QUOTE } from '@/lib/msw/handlers/demande-sur-mesure.handlers';
import { server } from '@/lib/msw/server';
import { withQueryClient } from '@/lib/test-utils';

import { useSubmitQuoteRequest } from '../hooks/useSubmitQuoteRequest';
import type { DemandeSurMesureFormValues } from '../schemas/wizard-step.schema';

vi.mock('next-auth/react', () => ({
  getSession: () => Promise.resolve({ user: { id: 'user-1', role: 'CLIENT' }, accessToken: 'mock-access-token' }),
}));

const BASE_VALUES: DemandeSurMesureFormValues = {
  garmentType: 'Robe de mariée',
  occasion: '',
  eventDate: '',
  budgetRange: '',
  details: '',
  fabricPreference: '',
  message: '',
};

describe('useSubmitQuoteRequest', () => {
  it('submits and exposes the created quote', async () => {
    const { result } = renderHook(() => useSubmitQuoteRequest(), { wrapper: withQueryClient() });

    await result.current.submit(BASE_VALUES, ['media-1']);

    await waitFor(() => expect(result.current.quote?.quoteNumber).toBe(SAMPLE_QUOTE.quoteNumber));
  });

  it('omits empty optional fields from the request payload sent to POST /quotes/requests', async () => {
    let capturedBody: unknown;
    server.use(
      http.post('http://localhost:3003/api/quotes/requests', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ success: true, data: SAMPLE_QUOTE });
      }),
    );

    const { result } = renderHook(() => useSubmitQuoteRequest(), { wrapper: withQueryClient() });

    await result.current.submit(BASE_VALUES, []);

    expect(capturedBody).toEqual({ garmentType: 'Robe de mariée', inspirationMediaIds: [] });
  });
});
