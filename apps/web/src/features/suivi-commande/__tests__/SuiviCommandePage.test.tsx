import { render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrderStatus } from '@angaly/types';

import { apiClient } from '@/lib/api-client';
import { createTestQueryClient } from '@/lib/test-utils';

import { SuiviCommandePage } from '../ui/SuiviCommandePage';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

function renderPage(orderNumber = 'ANG-2938') {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <SuiviCommandePage orderNumber={orderNumber} />
    </QueryClientProvider>,
  );
}

describe('SuiviCommandePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the order tracking timeline and summary once loaded', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([
      {
        id: 'order-1',
        orderNumber: 'ANG-2938',
        customerId: 'cust-1',
        status: OrderStatus.IN_PRODUCTION,
        subtotal: '150000.00',
        shippingCost: '10000.00',
        total: '160000.00',
        currency: 'MGA',
        shippingAddressJson: null,
        items: [{ id: 'item-1', orderId: 'order-1', productVariantId: 'variant-abc123', quantity: 1, unitPrice: '150000.00' }],
        createdAt: '2026-09-10T10:00:00.000Z',
        updatedAt: '2026-09-12T09:00:00.000Z',
      },
    ] as never);

    renderPage();

    await waitFor(() => expect(screen.getByText('Commande #ANG-2938')).toBeInTheDocument());
    expect(screen.getByText('Avancement de la production')).toBeInTheDocument();
    expect(screen.getByText('Récapitulatif')).toBeInTheDocument();
    expect(screen.getByText(/Contacter ANGALY/i)).toBeInTheDocument();
  });

  it('shows a not-found state when no order matches', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([] as never);

    renderPage('UNKNOWN');

    await waitFor(() => expect(screen.getByText('Commande introuvable')).toBeInTheDocument());
  });
});
