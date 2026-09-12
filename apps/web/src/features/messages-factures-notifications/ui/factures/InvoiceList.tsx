import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useInvoices } from '../../hooks/useInvoices';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';
import { DownloadInvoiceButton } from './DownloadInvoiceButton';
import { formatCurrency } from '@/features/_shared/utils/formatCurrency';

export const InvoiceList: React.FC = () => {
  const { invoices } = useInvoices();

  if (invoices.length === 0) {
    return (
      <div className="p-12 text-center text-slate bg-white rounded-2xl border border-border">
        Vous n'avez aucune facture pour le moment.
      </div>
    );
  }

  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-ivory-warm text-slate font-medium">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Transaction / Commande</th>
              <th className="px-6 py-4">Montant</th>
              <th className="px-6 py-4">Statut</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-slate">
                  {format(new Date(inv.date), 'dd MMM yyyy', { locale: fr })}
                </td>
                <td className="px-6 py-4">
                  <p className="font-mono text-primary-deep-navy">{inv.transactionRef}</p>
                  <p className="text-xs text-slate">Liée à {inv.orderReference}</p>
                </td>
                <td className="px-6 py-4 font-medium text-primary-deep-navy">
                  {formatCurrency(inv.amount)}
                </td>
                <td className="px-6 py-4">
                  <InvoiceStatusBadge status={inv.status} />
                </td>
                <td className="px-6 py-4 text-right">
                  <DownloadInvoiceButton invoiceId={inv.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
