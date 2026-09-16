import React from 'react';
import { Download } from 'lucide-react';
import { useDownloadInvoice } from '../../hooks/useDownloadInvoice';

interface Props {
  invoiceId: string;
}

/**
 * Always disabled — no PDF exists to download yet (see
 * docs/pages/messages-factures-notifications.md "Points d'attention"). The
 * `invoiceId` prop is kept so the wiring is ready the day a real
 * `GET /api/payments/:id/invoice-pdf` endpoint ships.
 */
export const DownloadInvoiceButton: React.FC<Props> = ({ invoiceId: _invoiceId }) => {
  const { isAvailable } = useDownloadInvoice();

  return (
    <button
      type="button"
      disabled={!isAvailable}
      title="Le téléchargement de facture arrive bientôt"
      className="flex items-center gap-2 px-4 py-2 bg-ivory-warm rounded-lg text-sm font-medium text-slate opacity-60 cursor-not-allowed"
    >
      <Download size={16} />
      Bientôt disponible
    </button>
  );
};
