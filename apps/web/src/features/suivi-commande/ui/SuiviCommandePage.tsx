'use client';

import React from 'react';
import Link from 'next/link';
import { OrderStatus } from '@angaly/types';
import { useOrderTracking } from '../hooks/useOrderTracking';
import { OrderReferenceHeader } from './OrderReferenceHeader';
import { OrderTrackingTimeline } from './OrderTrackingTimeline';
import { OrderSummaryCard } from './OrderSummaryCard';
import { ContactAngalySupportButton } from './ContactAngalySupportButton';

interface Props {
  orderNumber: string;
}

export const SuiviCommandePage: React.FC<Props> = ({ orderNumber }) => {
  const { order, timelineSteps, isLoading, isError, isCancelled } = useOrderTracking(orderNumber);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto pb-12 animate-pulse">
        <div className="h-16 w-full max-w-md bg-ivory-warm rounded-xl mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-64 bg-ivory-warm rounded-xl" />
          <div className="lg:col-span-1 h-64 bg-ivory-warm rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="max-w-5xl mx-auto pb-12 text-center py-24">
        <h1 className="font-serif text-2xl text-primary-deep-navy mb-4">
          Commande introuvable
        </h1>
        <p className="text-slate mb-8">
          Nous n&apos;avons pas trouvé de commande correspondant à la référence{' '}
          <strong>#{orderNumber}</strong>.
        </p>
        <Link
          href="/espace-client"
          className="inline-flex items-center justify-center px-8 py-3 bg-primary-deep-navy text-white font-medium rounded-full hover:bg-primary-dark transition-colors"
        >
          Retour à mon espace client
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <OrderReferenceHeader order={order} />

      {isCancelled && (
        <p className="mb-8 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          Cette commande a été {order.status === OrderStatus.REFUNDED ? 'remboursée' : 'annulée'} — le suivi
          de production ne s&apos;applique plus.
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <OrderTrackingTimeline steps={timelineSteps} />
        </div>

        <div className="lg:col-span-1">
          <OrderSummaryCard order={order} />
          <ContactAngalySupportButton orderNumber={order.orderNumber} />
        </div>
      </div>
    </div>
  );
};
