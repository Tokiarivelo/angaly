'use client';

import React from 'react';
import Image from 'next/image';
import { useCartStore } from '@/stores/cart.store';

export const CheckoutOrderSummarySidebar: React.FC<{ shippingCost: number }> = ({ shippingCost }) => {
  const { items } = useCartStore();

  const subtotal = items.reduce((acc, item) => acc + Number(item.priceAmount) * item.quantity, 0);
  const total = subtotal + shippingCost;
  const currency = items.length > 0 ? items[0]!.currency : 'MGA';

  return (
    <div className="bg-ivory border border-border rounded-xl p-6 lg:p-8 sticky top-24">
      <h3 className="font-serif text-xl text-primary-deep-navy mb-6">Récapitulatif</h3>
      
      <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-2">
        {items.map((item) => (
          <div key={item.variantId} className="flex gap-4 items-start">
            <div className="relative w-16 h-20 bg-white rounded border border-border overflow-hidden flex-shrink-0">
              {item.imageUrl ? (
                <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-slate/10" />
              )}
              <div className="absolute -top-2 -right-2 w-5 h-5 bg-primary-deep-navy text-white text-xs font-medium rounded-full flex items-center justify-center">
                {item.quantity}
              </div>
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm text-primary-deep-navy line-clamp-2">{item.name}</p>
              <p className="text-xs text-slate mt-1">{item.size} • {item.color}</p>
              <p className="font-medium text-primary-deep-navy text-sm mt-1">
                {(Number(item.priceAmount) * item.quantity).toLocaleString('fr-FR')} {currency}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3 mb-6 pt-6 border-t border-border">
        <div className="flex justify-between text-sm text-slate">
          <span>Sous-total</span>
          <span>{subtotal.toLocaleString('fr-FR')} {currency}</span>
        </div>
        <div className="flex justify-between text-sm text-slate">
          <span>Livraison</span>
          <span>{shippingCost === 0 ? 'Gratuit' : `${shippingCost.toLocaleString('fr-FR')} ${currency}`}</span>
        </div>
      </div>
      
      <div className="border-t border-border pt-4">
        <div className="flex justify-between items-center mb-1">
          <span className="font-serif text-xl font-medium text-primary-deep-navy">Total</span>
          <span className="font-serif text-xl font-medium text-primary-deep-navy">
            {total.toLocaleString('fr-FR')} {currency}
          </span>
        </div>
        <p className="text-xs text-slate text-right">Taxes incluses</p>
      </div>
    </div>
  );
};
