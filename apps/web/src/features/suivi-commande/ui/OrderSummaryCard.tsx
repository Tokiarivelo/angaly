import React from 'react';
import type { OrderDetails } from '../hooks/useOrderTracking';
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('fr-FR').format(amount) + ' Ar';

interface Props {
  order: OrderDetails;
}

export const OrderSummaryCard: React.FC<Props> = ({ order }) => {
  return (
    <div className="bg-white border border-border rounded-2xl p-6">
      <h2 className="font-serif text-lg text-primary-deep-navy mb-4">Récapitulatif</h2>
      
      <div className="space-y-4 mb-6">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between items-start text-sm">
            <div>
              <p className="font-medium text-primary-deep-navy">{item.productName}</p>
              <p className="text-slate text-xs">Quantité : {item.quantity}</p>
            </div>
            <span className="font-medium text-primary-deep-navy">
              {formatCurrency(item.price * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      <div className="border-t border-border pt-4 space-y-2 text-sm">
        <div className="flex justify-between text-slate">
          <span>Sous-total</span>
          <span>{formatCurrency(order.subtotal)}</span>
        </div>
        <div className="flex justify-between text-slate">
          <span>Frais de livraison</span>
          <span>{formatCurrency(order.shippingCost)}</span>
        </div>
        <div className="flex justify-between font-medium text-primary-deep-navy pt-2 text-base">
          <span>Total</span>
          <span>{formatCurrency(order.total)}</span>
        </div>
      </div>

      {order.atelierName && (
        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-xs text-slate uppercase tracking-wider font-semibold mb-2">Atelier en charge</p>
          <p className="text-sm text-primary-deep-navy font-medium">{order.atelierName}</p>
        </div>
      )}
    </div>
  );
};
