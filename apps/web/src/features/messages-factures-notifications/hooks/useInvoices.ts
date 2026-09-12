export type InvoiceStatus = 'PAID' | 'PENDING' | 'PARTIALLY_PAID' | 'REFUNDED';

export interface Invoice {
  id: string; // derived from Payment ID
  transactionRef: string;
  orderReference: string; // derived from relation
  amount: number;
  status: InvoiceStatus;
  date: string;
}

const MOCK_INVOICES: Invoice[] = [
  {
    id: 'pay-1',
    transactionRef: 'TRX-12345',
    orderReference: 'ANG-2938',
    amount: 150000,
    status: 'PAID',
    date: '2026-09-20T10:00:00Z',
  },
  {
    id: 'pay-2',
    transactionRef: 'TRX-98765',
    orderReference: 'ANG-1001',
    amount: 50000,
    status: 'REFUNDED',
    date: '2026-08-05T14:00:00Z',
  }
];

export const useInvoices = () => {
  return { invoices: MOCK_INVOICES };
};
