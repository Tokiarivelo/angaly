import type { QuoteDto } from '@angaly/types';

interface ClientProjectInfoRowProps {
  quote: QuoteDto;
  customerName?: string;
  creationName?: string;
}

export const ClientProjectInfoRow = ({ quote, customerName, creationName }: ClientProjectInfoRowProps) => {
  return (
    <div className="grid grid-cols-1 gap-8 border-b border-border py-8 md:grid-cols-2">
      <div>
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-warm">Client</h3>
        <p className="font-medium text-navy-deep">{customerName ?? 'Client'}</p>
        <p className="text-sm text-navy-soft">{quote.customerId}</p>
      </div>
      <div>
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-warm">Projet</h3>
        {creationName ? (
          <p className="font-medium text-navy-deep">{creationName}</p>
        ) : (
          <p className="font-medium text-navy-deep">Création Sur Mesure</p>
        )}
        {quote.description && (
          <p className="mt-2 text-sm text-gray-warm leading-relaxed">{quote.description}</p>
        )}
      </div>
    </div>
  );
};
