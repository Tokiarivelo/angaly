import React from 'react';
import type { TrackingTimelineStep } from '../hooks/useOrderTracking';
import { TrackingStepNode } from './TrackingStepNode';

interface Props {
  steps: TrackingTimelineStep[];
}

export const OrderTrackingTimeline: React.FC<Props> = ({ steps }) => {
  return (
    <div className="bg-white border border-border rounded-2xl p-6 md:p-8">
      <h2 className="font-serif text-xl text-primary-deep-navy mb-8">
        Avancement de la production
      </h2>
      
      <div className="flex flex-col lg:flex-row w-full">
        {steps.map((step, index) => (
          <TrackingStepNode 
            key={step.key} 
            step={step} 
            isLast={index === steps.length - 1} 
          />
        ))}
      </div>
    </div>
  );
};
