import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ShoppingBag, CheckCircle2, PackageOpen, Truck } from 'lucide-react';
import { OrderStatus } from '@angaly/types';

export interface CurrentOrderCardData {
  id: string; // orderNumber
  status: OrderStatus;
  createdAt: string;
}

interface CurrentOrderCardProps {
  order?: CurrentOrderCardData | null;
}

const ORDER_STATUS_LABELS: Partial<Record<OrderStatus, string>> = {
  [OrderStatus.CONFIRMED]: 'Confirmée',
  [OrderStatus.PAID]: 'Payée',
  [OrderStatus.IN_PRODUCTION]: 'En préparation',
  [OrderStatus.READY]: 'Prête',
};

export const CurrentOrderCard: React.FC<CurrentOrderCardProps> = ({ order }) => {
  if (!order) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-border flex flex-col items-center justify-center text-center h-full min-h-[200px]">
        <div className="w-12 h-12 bg-ivory-warm rounded-full flex items-center justify-center mb-4">
          <ShoppingBag className="text-slate" size={24} />
        </div>
        <h3 className="font-medium text-primary-deep-navy mb-2">Aucune commande</h3>
        <p className="text-sm text-slate">Vous n'avez pas de commande en cours.</p>
      </div>
    );
  }

  // Example timeline UI
  return (
    <div className="bg-white p-6 rounded-2xl border border-border h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-ivory-warm rounded-full flex items-center justify-center text-primary-deep-navy">
            <ShoppingBag size={20} />
          </div>
          <div>
            <h2 className="font-serif text-lg text-primary-deep-navy">Commande #{order.id}</h2>
            <p className="text-xs text-slate">Passée le {format(new Date(order.createdAt), 'd MMM yyyy', { locale: fr })}</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-ivory-warm text-primary-deep-navy text-xs font-medium rounded-full">
          {ORDER_STATUS_LABELS[order.status] ?? 'En cours'}
        </span>
      </div>

      <div className="flex-1">
        <div className="relative pl-6 space-y-6 before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
          {/* Status dots */}
          <div className="relative flex items-center justify-between">
            <div className="flex flex-col items-center">
              <div className="w-6 h-6 rounded-full bg-primary-deep-navy text-white flex items-center justify-center z-10"><CheckCircle2 size={14}/></div>
              <span className="text-xs font-medium mt-2 text-primary-deep-navy">Validée</span>
            </div>
            <div className="flex flex-col items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 ${order.status === OrderStatus.IN_PRODUCTION || order.status === OrderStatus.READY ? 'bg-primary-deep-navy text-white' : 'bg-ivory-warm border-2 border-border text-slate'}`}><PackageOpen size={14}/></div>
              <span className="text-xs font-medium mt-2 text-primary-deep-navy">Préparation</span>
            </div>
            <div className={`flex flex-col items-center ${order.status === OrderStatus.READY ? '' : 'opacity-40'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 ${order.status === OrderStatus.READY ? 'bg-primary-deep-navy text-white' : 'bg-ivory-warm border-2 border-border text-slate'}`}><Truck size={14}/></div>
              <span className="text-xs font-medium mt-2 text-slate">Expédiée</span>
            </div>
          </div>
        </div>
      </div>

      <Link href={`/suivi-commande/${order.id}`} className="mt-6 text-sm font-medium text-primary-deep-navy hover:underline underline-offset-4">
        Suivre ma commande &rarr;
      </Link>
    </div>
  );
};
