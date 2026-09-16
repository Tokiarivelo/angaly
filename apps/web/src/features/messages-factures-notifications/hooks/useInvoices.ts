import { PaymentStatus } from '@angaly/types';
import { useOrdersQuery, usePaymentsQuery } from '../api/invoices.api';

export type InvoiceStatus = 'PAID' | 'PENDING' | 'PARTIALLY_PAID' | 'REFUNDED';

export interface Invoice {
  id: string; // derived from Payment ID
  transactionRef: string;
  orderReference: string; // derived from relation
  amount: number;
  status: InvoiceStatus;
  date: string;
}

/**
 * `FAILED` and `AUTHORIZED` have no dedicated visual state in the mockup
 * (see docs/pages/messages-factures-notifications.md "Points d'attention") —
 * both fold into `PENDING`, the closest "not settled yet" status.
 */
const INVOICE_STATUS_MAP: Record<PaymentStatus, InvoiceStatus> = {
  [PaymentStatus.PENDING]: 'PENDING',
  [PaymentStatus.AUTHORIZED]: 'PENDING',
  [PaymentStatus.PAID]: 'PAID',
  [PaymentStatus.PARTIALLY_PAID]: 'PARTIALLY_PAID',
  [PaymentStatus.FAILED]: 'PENDING',
  [PaymentStatus.REFUNDED]: 'REFUNDED',
};

/**
 * "Factures" have no dedicated model — derived from `Payment`, joined with the
 * (small) own-orders list to resolve a human `orderReference` (`orderNumber`)
 * instead of the raw `orderId` (see docs/pages/messages-factures-notifications.md).
 */
export const useInvoices = () => {
  const paymentsQuery = usePaymentsQuery();
  const ordersQuery = useOrdersQuery();

  const invoices: Invoice[] = (paymentsQuery.data ?? []).map((payment) => {
    const order = ordersQuery.data?.find((candidate) => candidate.id === payment.orderId);
    return {
      id: payment.id,
      transactionRef: payment.transactionRef ?? payment.id,
      orderReference: order?.orderNumber ?? payment.orderId,
      amount: Number(payment.amount),
      status: INVOICE_STATUS_MAP[payment.status],
      date: payment.createdAt,
    };
  });

  return {
    invoices,
    isLoading: paymentsQuery.isLoading || ordersQuery.isLoading,
    isError: paymentsQuery.isError,
  };
};
