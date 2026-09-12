import type { QuoteDto } from '@angaly/types';

interface TotalsBlockProps {
  quote: QuoteDto;
}

export const TotalsBlock = ({ quote }: TotalsBlockProps) => {
  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(parseFloat(value));
  };

  return (
    <div className="flex flex-col gap-6 py-8 md:flex-row md:justify-end">
      <div className="w-full md:w-1/2 lg:w-1/3">
        <div className="flex flex-col gap-4 rounded-xl bg-ivory-warm p-6">
          <div className="flex justify-between text-sm text-navy-soft">
            <span>Sous-total</span>
            <span>{formatCurrency(quote.subtotal)}</span>
          </div>
          
          <div className="flex justify-between text-sm font-medium text-navy-deep">
            <span>Acompte requis</span>
            <span>{formatCurrency(quote.depositAmount)}</span>
          </div>
          
          <div className="flex justify-between text-sm text-navy-soft">
            <span>Solde (à la livraison)</span>
            <span>{formatCurrency(quote.balanceAmount)}</span>
          </div>
          
          <div className="mt-2 flex justify-between border-t border-border pt-4 font-serif text-xl font-bold text-navy-deep">
            <span>Total TTC</span>
            <span>{formatCurrency(quote.total)}</span>
          </div>

          {quote.estimatedDelayDays && (
            <div className="mt-2 text-center text-xs text-gray-warm">
              Délai estimé : ~{quote.estimatedDelayDays} jours après paiement de l'acompte
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
