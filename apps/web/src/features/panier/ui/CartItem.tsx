'use client';

import React from 'react';
import Image from 'next/image';
import { Minus, Plus, Trash2 } from 'lucide-react';
import type { CartItem as CartItemType } from '@/stores/cart.store';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (variantId: string, quantity: number) => void;
  onRemove: (variantId: string) => void;
}

export const CartItem: React.FC<CartItemProps> = ({ item, onUpdateQuantity, onRemove }) => {
  const isLowStock = false; // TODO: Fetch from inventory

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center py-6 border-b border-border gap-6">
      {/* Thumbnail */}
      <div className="relative w-24 h-32 bg-ivory rounded overflow-hidden flex-shrink-0 border border-border">
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
        ) : (
          <div className="w-full h-full bg-slate/10" />
        )}
      </div>

      {/* Details */}
      <div className="flex-1 flex flex-col justify-between h-full w-full">
        <div className="flex justify-between items-start w-full">
          <div>
            <h3 className="font-serif text-lg text-primary-deep-navy">{item.name}</h3>
            <p className="text-sm text-slate mt-1">
              Taille: {item.size} • Couleur: {item.color}
            </p>
            {isLowStock && (
              <p className="text-xs font-medium text-[#A47735] mt-2">
                Dernière pièce — stock limité
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="font-medium text-primary-deep-navy">
              {Number(item.priceAmount).toLocaleString('fr-FR')} {item.currency}
            </p>
          </div>
        </div>

        {/* Actions & Total */}
        <div className="flex justify-between items-center mt-4 w-full">
          <div className="flex items-center gap-4">
            <div className="flex items-center border border-border rounded-full bg-white overflow-hidden">
              <button
                type="button"
                onClick={() => onUpdateQuantity(item.variantId, Math.max(1, item.quantity - 1))}
                className="p-2 text-primary-deep-navy hover:bg-ivory-warm transition-colors"
                disabled={item.quantity <= 1}
              >
                <Minus size={14} />
              </button>
              <span className="px-3 text-sm font-medium w-8 text-center">{item.quantity}</span>
              <button
                type="button"
                onClick={() => onUpdateQuantity(item.variantId, item.quantity + 1)}
                className="p-2 text-primary-deep-navy hover:bg-ivory-warm transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
            
            <button
              type="button"
              onClick={() => onRemove(item.variantId)}
              className="text-slate hover:text-red-500 transition-colors p-2"
              title="Supprimer"
            >
              <Trash2 size={16} />
            </button>
          </div>
          
          <div className="text-right">
            <p className="text-xs text-slate">Total ligne</p>
            <p className="font-medium text-primary-deep-navy">
              {(Number(item.priceAmount) * item.quantity).toLocaleString('fr-FR')} {item.currency}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
