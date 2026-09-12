'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface OrderSummaryProps {
  subtotal: number;
  currency: string;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({ subtotal, currency }) => {
  const [promoCode, setPromoCode] = useState('');
  
  // Fake estimation
  const shippingEstimate: number = subtotal > 0 ? 0 : 0; 
  const total = subtotal + shippingEstimate;

  return (
    <div className="bg-ivory border border-border rounded-xl p-6 lg:p-8 sticky top-24">
      <h2 className="font-serif text-2xl text-primary-deep-navy mb-6">Résumé de la commande</h2>
      
      <div className="space-y-4 mb-8">
        <div className="flex justify-between text-sm text-slate">
          <span>Sous-total</span>
          <span>{subtotal.toLocaleString('fr-FR')} {currency}</span>
        </div>
        <div className="flex justify-between text-sm text-slate">
          <span>Livraison estimée</span>
          <span>{shippingEstimate === 0 ? 'Calculée à la prochaine étape' : `${shippingEstimate.toLocaleString('fr-FR')} ${currency}`}</span>
        </div>
      </div>
      
      <div className="border-t border-border pt-4 mb-8">
        <div className="flex justify-between items-center mb-1">
          <span className="font-serif text-xl font-medium text-primary-deep-navy">Total</span>
          <span className="font-serif text-xl font-medium text-primary-deep-navy">
            {total.toLocaleString('fr-FR')} {currency}
          </span>
        </div>
        <p className="text-xs text-slate text-right">Taxes incluses</p>
      </div>

      <div className="mb-8">
        <label htmlFor="promo" className="block text-sm font-medium text-primary-deep-navy mb-2">Code promotionnel</label>
        <div className="flex gap-2">
          <input
            type="text"
            id="promo"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            className="flex-1 border border-border bg-white rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary-deep-navy focus:ring-1 focus:ring-primary-deep-navy transition-colors"
            placeholder="Entrez votre code"
          />
          <button
            type="button"
            className="px-4 py-2 border border-primary-deep-navy text-primary-deep-navy text-sm font-medium rounded-md hover:bg-primary-deep-navy hover:text-white transition-colors"
          >
            Appliquer
          </button>
        </div>
      </div>

      <Link
        href="/checkout"
        className="flex items-center justify-center w-full py-3 bg-primary-deep-navy text-white font-medium rounded-full hover:bg-primary-dark transition-colors"
      >
        Passer la commande
      </Link>
    </div>
  );
};
