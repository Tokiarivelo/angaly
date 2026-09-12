import React from 'react';
import { Package } from 'lucide-react';
import type { OrderDetails } from '../hooks/useOrderTracking';

interface Props {
  order: OrderDetails;
}

export const OrderReferenceHeader: React.FC<Props> = ({ order }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
      <div className="w-16 h-16 bg-white border border-border rounded-xl flex items-center justify-center text-primary-deep-navy shrink-0">
        <Package size={28} />
      </div>
      <div>
        <h1 className="font-serif text-2xl md:text-3xl text-primary-deep-navy">
          Commande #{order.orderNumber}
        </h1>
        <p className="text-slate text-sm mt-1">
          Suivez l'avancement de la production de vos pièces.
        </p>
      </div>
    </div>
  );
};
