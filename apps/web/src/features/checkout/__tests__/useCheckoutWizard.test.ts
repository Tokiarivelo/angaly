import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { apiClient } from '@/lib/api-client';
import { withQueryClient } from '@/lib/test-utils';
import { PaymentMethod, PaymentStatus, OrderStatus } from '@angaly/types';

import { useCheckoutWizard } from '../hooks/useCheckoutWizard';

const MOCK_SESSION = {
  user: { id: 'user-1', role: 'CLIENT', email: 'nirina@example.com' },
  accessToken: 'mock-access-token',
};

let sessionStatus: 'authenticated' | 'unauthenticated' = 'authenticated';

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: sessionStatus === 'authenticated' ? MOCK_SESSION : null, status: sessionStatus }),
}));

const clearMock = vi.fn();
let cartItems: { variantId: string; quantity: number; priceAmount: string; currency: string; name: string; sku: string; size: string; color: string; imageUrl: string | null; productId: string }[] = [];

vi.mock('@/stores/cart.store', () => ({
  useCartStore: () => ({ items: cartItems, clear: clearMock }),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const MOCK_ORDER = {
  id: 'order-1',
  orderNumber: 'ANG-2026-0001',
  customerId: 'cust-1',
  status: OrderStatus.PENDING,
  subtotal: '150000.00',
  shippingCost: '15000.00',
  total: '165000.00',
  currency: 'MGA',
  shippingAddressJson: null,
  items: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const MOCK_PAYMENT = {
  id: 'payment-1',
  orderId: 'order-1',
  method: PaymentMethod.MOBILE_MONEY,
  status: PaymentStatus.PENDING,
  amount: '165000.00',
  transactionRef: null,
  paidAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('useCheckoutWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStatus = 'authenticated';
    cartItems = [
      {
        productId: 'p-1',
        variantId: 'v-1',
        name: 'Robe Solène',
        sku: 'SOL-01',
        size: '38',
        color: 'Ivoire',
        imageUrl: null,
        priceAmount: '150000',
        currency: 'MGA',
        quantity: 1,
      },
    ];
  });

  it('starts on the expedition step with no order/payment', () => {
    const { result } = renderHook(() => useCheckoutWizard(), { wrapper: withQueryClient() });

    expect(result.current.step).toBe('expedition');
    expect(result.current.order).toBeNull();
    expect(result.current.payment).toBeNull();
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('reports unauthenticated when there is no session', () => {
    sessionStatus = 'unauthenticated';
    const { result } = renderHook(() => useCheckoutWizard(), { wrapper: withQueryClient() });

    expect(result.current.isAuthenticated).toBe(false);
  });

  it('createOrder posts the cart items and moves to the paiement step', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce(MOCK_ORDER as never);

    const { result } = renderHook(() => useCheckoutWizard(), { wrapper: withQueryClient() });

    await act(async () => {
      await result.current.createOrder({
        prenom: 'Nirina',
        nom: 'Rakoto',
        email: 'nirina@example.com',
        telephone: '+261340000000',
        adresse: 'Lot II A',
        ville: 'Antananarivo',
        region: 'Analamanga',
        method: 'domicile',
      });
    });

    expect(apiClient.post).toHaveBeenCalledWith('/orders', {
      items: [{ productVariantId: 'v-1', quantity: 1 }],
      shippingAddressJson: {
        prenom: 'Nirina',
        nom: 'Rakoto',
        email: 'nirina@example.com',
        telephone: '+261340000000',
        adresse: 'Lot II A',
        ville: 'Antananarivo',
        region: 'Analamanga',
        method: 'domicile',
      },
    });
    await waitFor(() => expect(result.current.order).toEqual(MOCK_ORDER));
    expect(result.current.step).toBe('paiement');
  });

  it('submitPayment posts the payment, clears the cart and moves to confirmation', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce(MOCK_ORDER as never);
    vi.mocked(apiClient.post).mockResolvedValueOnce(MOCK_PAYMENT as never);

    const { result } = renderHook(() => useCheckoutWizard(), { wrapper: withQueryClient() });

    await act(async () => {
      await result.current.createOrder({
        prenom: 'Nirina',
        nom: 'Rakoto',
        email: 'nirina@example.com',
        telephone: '+261340000000',
        adresse: 'Lot II A',
        ville: 'Antananarivo',
        region: 'Analamanga',
        method: 'domicile',
      });
    });

    await act(async () => {
      await result.current.submitPayment(PaymentMethod.MOBILE_MONEY);
    });

    expect(apiClient.post).toHaveBeenCalledWith('/payments', {
      orderId: 'order-1',
      method: PaymentMethod.MOBILE_MONEY,
    });
    expect(clearMock).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(result.current.payment).toEqual(MOCK_PAYMENT));
    expect(result.current.step).toBe('confirmation');
  });

  it('submitPayment is a no-op without a created order', async () => {
    const { result } = renderHook(() => useCheckoutWizard(), { wrapper: withQueryClient() });

    const outcome = await result.current.submitPayment(PaymentMethod.CASH_ON_DELIVERY);

    expect(outcome).toBeNull();
    expect(apiClient.post).not.toHaveBeenCalled();
    expect(result.current.step).toBe('expedition');
  });

  it('surfaces the order creation error message', async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Stock insuffisant'));

    const { result } = renderHook(() => useCheckoutWizard(), { wrapper: withQueryClient() });

    await act(async () => {
      await expect(
        result.current.createOrder({
          prenom: 'Nirina',
          nom: 'Rakoto',
          email: 'nirina@example.com',
          telephone: '+261340000000',
          adresse: 'Lot II A',
          ville: 'Antananarivo',
          region: 'Analamanga',
          method: 'domicile',
        }),
      ).rejects.toThrow('Stock insuffisant');
    });

    await waitFor(() => expect(result.current.createOrderError).toBe('Stock insuffisant'));
    expect(result.current.step).toBe('expedition');
  });
});
