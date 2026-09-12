'use client';

import React from 'react';
import { useOrderTracking } from '../hooks/useOrderTracking';
import { OrderReferenceHeader } from './OrderReferenceHeader';
import { OrderTrackingTimeline } from './OrderTrackingTimeline';
import { OrderSummaryCard } from './OrderSummaryCard';
import { ContactAngalySupportButton } from './ContactAngalySupportButton';

interface Props {
  orderNumber: string;
}

export const SuiviCommandePage: React.FC<Props> = ({ orderNumber }) => {
  const { order, timelineSteps } = useOrderTracking(orderNumber);

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <OrderReferenceHeader order={order} />
      
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
