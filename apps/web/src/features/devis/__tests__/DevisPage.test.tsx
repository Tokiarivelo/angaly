import { render, screen } from '@testing-library/react';
import { DevisPage } from '../ui/DevisPage';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as useQuoteModule from '../hooks/useQuote';
import { QuoteStatus } from '@angaly/types';
import { withQueryClient } from '@/lib/test-utils';

vi.mock('../hooks/useAcceptQuote', () => ({
  useAcceptQuote: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock('../hooks/useRejectQuote', () => ({
  useRejectQuote: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock('../hooks/useRequestQuoteChange', () => ({
  useRequestQuoteChange: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock('../hooks/useDownloadQuotePdf', () => ({
  useDownloadQuotePdf: () => ({ downloadPdf: vi.fn() }),
}));

const MOCK_QUOTE = {
  id: '1',
  quoteNumber: 'ANG-DEV-123',
  customerId: 'cust-1',
  creationId: null,
  description: 'Test description',
  lineItems: [
    { label: 'Tissu', quantity: 1, unitPrice: '50.00' }
  ],
  subtotal: '50.00',
  depositAmount: '25.00',
  balanceAmount: '25.00',
  total: '50.00',
  status: QuoteStatus.SENT,
  validUntil: null,
  estimatedDelayDays: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('DevisPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders loading state', () => {
    vi.spyOn(useQuoteModule, 'useQuote').mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    render(<DevisPage quoteNumber="ANG-DEV-123" />, { wrapper: withQueryClient() });
    
    // SVG spinner
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders error state when quote is not found', () => {
    vi.spyOn(useQuoteModule, 'useQuote').mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Not found'),
    } as any);

    render(<DevisPage quoteNumber="ANG-DEV-123" />, { wrapper: withQueryClient() });
    
    expect(screen.getByText('Devis introuvable')).toBeInTheDocument();
  });

  it('renders quote details', () => {
    vi.spyOn(useQuoteModule, 'useQuote').mockReturnValue({
      data: MOCK_QUOTE,
      isLoading: false,
      error: null,
    } as any);

    render(<DevisPage quoteNumber="ANG-DEV-123" />, { wrapper: withQueryClient() });
    
    expect(screen.getByText('Devis ANG-DEV-123')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getAllByText('Tissu')[0]).toBeInTheDocument();
    
    // Button to accept
    expect(screen.getByText('Accepter le devis')).toBeInTheDocument();
  });

  it('renders accepted state properly', () => {
    vi.spyOn(useQuoteModule, 'useQuote').mockReturnValue({
      data: { ...MOCK_QUOTE, status: QuoteStatus.ACCEPTED },
      isLoading: false,
      error: null,
    } as any);

    render(<DevisPage quoteNumber="ANG-DEV-123" />, { wrapper: withQueryClient() });
    
    expect(screen.getByText('Devis accepté')).toBeInTheDocument();
    expect(screen.queryByText('Accepter le devis')).not.toBeInTheDocument();
  });
});
