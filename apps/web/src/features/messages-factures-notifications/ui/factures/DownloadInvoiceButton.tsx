import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { useDownloadInvoice } from '../../hooks/useDownloadInvoice';

interface Props {
  invoiceId: string;
}

export const DownloadInvoiceButton: React.FC<Props> = ({ invoiceId }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const { download } = useDownloadInvoice();

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await download(invoiceId);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isDownloading}
      className="flex items-center gap-2 px-4 py-2 bg-ivory-warm hover:bg-border rounded-lg text-sm font-medium text-primary-deep-navy transition-colors disabled:opacity-50"
    >
      {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
      PDF
    </button>
  );
};
