'use client';

import { useQuote } from '../hooks/useQuote';
import { DocumentHeaderCard } from './DocumentHeaderCard';
import { ClientProjectInfoRow } from './ClientProjectInfoRow';
import { LineItemsTable } from './LineItemsTable';
import { TotalsBlock } from './TotalsBlock';
import { QuoteActionsBar } from './QuoteActionsBar';
import { QuoteStatusTimeline } from './QuoteStatusTimeline';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

interface DevisPageProps {
  quoteNumber: string;
}

export const DevisPage = ({ quoteNumber }: DevisPageProps) => {
  const { data: quote, isLoading, error } = useQuote(quoteNumber);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-navy-deep" />
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <h2 className="mb-4 font-serif text-2xl text-navy-deep">Devis introuvable</h2>
        <p className="mb-8 text-gray-warm">
          Ce devis n'existe pas ou vous n'avez pas l'autorisation d'y accéder.
        </p>
        <Link 
          href="/mon-compte" 
          className="rounded-md bg-navy-deep px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Retour à mon compte
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Container shadow for document feel */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-border sm:p-12">
        <DocumentHeaderCard quote={quote} />
        
        <QuoteStatusTimeline status={quote.status} />
        
        <ClientProjectInfoRow quote={quote} />
        
        <LineItemsTable lineItems={quote.lineItems} />
        
        <TotalsBlock quote={quote} />
        
        <QuoteActionsBar quote={quote} />
      </div>
    </div>
  );
};
