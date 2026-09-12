import type { QuoteLineItemDto } from '@angaly/types';

interface LineItemsTableProps {
  lineItems: QuoteLineItemDto[];
}

export const LineItemsTable = ({ lineItems }: LineItemsTableProps) => {
  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(parseFloat(value));
  };

  if (!lineItems || lineItems.length === 0) {
    return (
      <div className="py-8 text-center text-gray-warm">
        Aucune prestation n'a encore été détaillée pour ce projet.
      </div>
    );
  }

  return (
    <div className="py-8">
      {/* Desktop View */}
      <div className="hidden md:block">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border">
              <th className="pb-4 font-serif text-sm text-navy-soft font-normal">Prestation</th>
              <th className="pb-4 font-serif text-sm text-navy-soft font-normal w-24 text-center">Qté</th>
              <th className="pb-4 font-serif text-sm text-navy-soft font-normal w-32 text-right">Prix unitaire</th>
              <th className="pb-4 font-serif text-sm text-navy-soft font-normal w-32 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {lineItems.map((item, index) => {
              const unitPrice = parseFloat(item.unitPrice);
              const total = unitPrice * item.quantity;
              return (
                <tr key={index} className="group transition-colors hover:bg-ivory-warm/30">
                  <td className="py-4 font-medium text-navy-deep">{item.label}</td>
                  <td className="py-4 text-center text-navy-soft">{item.quantity}</td>
                  <td className="py-4 text-right text-navy-soft">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-4 text-right font-medium text-navy-deep">{formatCurrency(total.toString())}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="flex flex-col gap-4 md:hidden">
        {lineItems.map((item, index) => {
          const unitPrice = parseFloat(item.unitPrice);
          const total = unitPrice * item.quantity;
          return (
            <div key={index} className="rounded-lg border border-border p-4 bg-white">
              <h4 className="font-medium text-navy-deep mb-3">{item.label}</h4>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-warm">Quantité</span>
                <span className="text-navy-deep">{item.quantity}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-warm">Prix unitaire</span>
                <span className="text-navy-deep">{formatCurrency(item.unitPrice)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium mt-3 pt-3 border-t border-border">
                <span className="text-navy-deep">Total</span>
                <span className="text-navy-deep">{formatCurrency(total.toString())}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
