'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/stores/cart.store';
import { CartItem } from './CartItem';
import { OrderSummary } from './OrderSummary';

export const PanierPage = () => {
  const { items, removeItem, updateQuantity } = useCartStore();

  const isEmpty = items.length === 0;

  const subtotal = items.reduce((acc, item) => {
    return acc + Number(item.priceAmount) * item.quantity;
  }, 0);

  const currency = items.length > 0 ? items[0]!.currency : 'MGA';

  if (isEmpty) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
        <div className="w-20 h-20 bg-ivory rounded-full flex items-center justify-center mb-6">
          <ShoppingBag size={32} className="text-primary-deep-navy opacity-50" />
        </div>
        <h1 className="font-serif text-3xl text-primary-deep-navy mb-4">Votre panier est vide</h1>
        <p className="text-slate mb-8 max-w-md text-center">
          Découvrez nos collections de prêt-à-porter ou personnalisez la robe de vos rêves.
        </p>
        <Link
          href="/pret-a-porter"
          className="px-8 py-3 bg-primary-deep-navy text-white font-medium rounded-full hover:bg-primary-dark transition-colors"
        >
          Continuer mes achats
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pb-24">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-8 md:pt-12">
        <h1 className="font-serif text-3xl md:text-5xl text-primary-deep-navy mb-10">Votre Panier</h1>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
          {/* Cart Items List */}
          <div className="flex-1">
            <div className="border-t border-border">
              {items.map((item) => (
                <CartItem
                  key={item.variantId}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                />
              ))}
            </div>

            <div className="mt-8">
              <Link
                href="/pret-a-porter"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary-deep-navy hover:text-champagne transition-colors"
              >
                <ArrowLeft size={16} />
                Continuer mes achats
              </Link>
            </div>
          </div>

          {/* Order Summary */}
          <div className="w-full lg:w-4/12 xl:w-3/12">
            <OrderSummary subtotal={subtotal} currency={currency} />
          </div>
        </div>
      </div>
    </div>
  );
};
