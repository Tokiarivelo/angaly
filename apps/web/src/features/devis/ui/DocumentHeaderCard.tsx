import type { QuoteDto } from '@angaly/types';
import { QUOTE_STATUS_CONFIG } from '../consts/quote-status-labels.const';

interface DocumentHeaderCardProps {
  quote: QuoteDto;
}

export const DocumentHeaderCard = ({ quote }: DocumentHeaderCardProps) => {
  const statusConfig = QUOTE_STATUS_CONFIG[quote.status];

  // Helper for variant classes
  const getBadgeClasses = (variant: typeof statusConfig.variant) => {
    switch (variant) {
      case 'info':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'success':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'error':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'slate':
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="flex flex-col border-b border-border pb-8 md:flex-row md:items-start md:justify-between">
      <div className="mb-6 md:mb-0">
        <h1 className="mb-2 font-serif text-3xl font-bold text-navy-deep tracking-wider">
          ANGALY
        </h1>
        <p className="text-sm text-gray-warm">Maison de Couture</p>
      </div>

      <div className="flex flex-col items-start gap-4 md:items-end">
        <div className="text-left md:text-right">
          <h2 className="font-serif text-2xl text-navy-deep">Devis {quote.quoteNumber}</h2>
          <p className="text-sm text-gray-warm mt-1">
            Émis le : {new Date(quote.createdAt).toLocaleDateString('fr-FR')}
          </p>
          {quote.validUntil && (
            <p className="text-sm text-gray-warm">
              Valable jusqu'au : {new Date(quote.validUntil).toLocaleDateString('fr-FR')}
            </p>
          )}
        </div>
        
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${getBadgeClasses(
            statusConfig.variant
          )}`}
        >
          {statusConfig.label}
        </span>
      </div>
    </div>
  );
};
