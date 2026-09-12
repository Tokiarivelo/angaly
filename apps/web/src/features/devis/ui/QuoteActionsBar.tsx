'use client';

import { useState } from 'react';
import type { QuoteDto} from '@angaly/types';
import { QuoteStatus } from '@angaly/types';
import { useAcceptQuote } from '../hooks/useAcceptQuote';
import { useRejectQuote } from '../hooks/useRejectQuote';
import { useDownloadQuotePdf } from '../hooks/useDownloadQuotePdf';
import { RequestChangeModal } from './RequestChangeModal';
import { Check, Download, FileText } from 'lucide-react';

interface QuoteActionsBarProps {
  quote: QuoteDto;
}

export const QuoteActionsBar = ({ quote }: QuoteActionsBarProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { mutate: acceptQuote, isPending: isAccepting } = useAcceptQuote();
  const { mutate: rejectQuote, isPending: isRejecting } = useRejectQuote();
  const { downloadPdf } = useDownloadQuotePdf();

  const isPendingState = isAccepting || isRejecting;

  if (quote.status === QuoteStatus.ACCEPTED) {
    return (
      <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-xl bg-green-50 p-6 md:flex-row">
        <div className="flex items-center gap-3 text-green-800">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-200">
            <Check className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-medium">Devis accepté</h3>
            <p className="text-sm opacity-80">Merci pour votre confiance. Nous préparons la suite de votre projet.</p>
          </div>
        </div>
        <button
          onClick={() => { void downloadPdf(quote.quoteNumber); }}
          className="flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-green-800 shadow-sm transition-colors hover:bg-green-100"
        >
          <Download className="h-4 w-4" />
          Télécharger le PDF
        </button>
      </div>
    );
  }

  if (quote.status === QuoteStatus.REJECTED || quote.status === QuoteStatus.EXPIRED) {
    return (
      <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-xl bg-gray-50 p-6 md:flex-row">
        <div className="text-gray-warm">
          <h3 className="font-medium">{quote.status === QuoteStatus.EXPIRED ? 'Devis expiré' : 'Devis refusé'}</h3>
          <p className="text-sm">Ce devis n'est plus valide pour acceptation.</p>
        </div>
        <button
          onClick={() => { void downloadPdf(quote.quoteNumber); }}
          className="flex items-center gap-2 rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-navy-deep transition-colors hover:bg-gray-50"
        >
          <Download className="h-4 w-4" />
          Télécharger le PDF
        </button>
      </div>
    );
  }

  // DRAFT should normally not be seen by client, but just in case
  if (quote.status === QuoteStatus.DRAFT) {
    return null; 
  }

  // SENT or VIEWED
  return (
    <>
      <div className="mt-8 flex flex-col items-center justify-between gap-6 border-t border-border pt-8 md:flex-row">
        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
          <button
            onClick={() => acceptQuote(quote.quoteNumber)}
            disabled={isPendingState}
            className="flex items-center justify-center gap-2 rounded-md bg-navy-deep px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isAccepting ? 'Acceptation...' : 'Accepter le devis'}
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={isPendingState}
            className="flex items-center justify-center gap-2 rounded-md border border-navy-deep bg-white px-6 py-3 text-sm font-medium text-navy-deep transition-colors hover:bg-ivory-warm disabled:opacity-50"
          >
            <FileText className="h-4 w-4" />
            Demander une modification
          </button>
        </div>
        
        <div className="flex w-full items-center justify-between md:w-auto md:gap-6">
          <button
            onClick={() => rejectQuote(quote.quoteNumber)}
            disabled={isPendingState}
            className="text-sm font-medium text-red-600 transition-colors hover:text-red-700 disabled:opacity-50"
          >
            Refuser le devis
          </button>
          
          <button
            onClick={() => { void downloadPdf(quote.quoteNumber); }}
            className="flex items-center gap-2 text-sm font-medium text-navy-soft transition-colors hover:text-navy-deep"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Télécharger PDF</span>
          </button>
        </div>
      </div>
      
      <RequestChangeModal 
        quoteNumber={quote.quoteNumber} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
};
