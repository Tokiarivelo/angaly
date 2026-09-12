import React from 'react';
import type { InvoiceStatus } from '../../hooks/useInvoices';

interface Props {
  status: InvoiceStatus;
}

export const InvoiceStatusBadge: React.FC<Props> = ({ status }) => {
  const configs: Record<InvoiceStatus, { label: string; classes: string }> = {
    PAID: { label: 'Payée', classes: 'bg-green-100 text-green-700' },
    PENDING: { label: 'En attente', classes: 'bg-orange-100 text-orange-700' },
    PARTIALLY_PAID: { label: 'Partiellement payée', classes: 'bg-blue-100 text-blue-700' },
    REFUNDED: { label: 'Remboursée', classes: 'bg-slate text-white' },
  };

  const config = configs[status];
  return (
    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${config.classes}`}>
      {config.label}
    </span>
  );
};
