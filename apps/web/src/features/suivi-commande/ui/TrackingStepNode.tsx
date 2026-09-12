import React from 'react';
import { Check } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { TrackingTimelineStep } from '../hooks/useOrderTracking';

interface Props {
  step: TrackingTimelineStep;
  isLast: boolean;
}

export const TrackingStepNode: React.FC<Props> = ({ step, isLast }) => {
  const isCompleted = step.state === 'completed';
  const isCurrent = step.state === 'current';
  const isUpcoming = step.state === 'upcoming';

  const dateStr = step.timestamp
    ? format(new Date(step.timestamp), 'dd MMM yyyy, HH:mm', { locale: fr })
    : undefined;

  return (
    <div className="relative flex flex-row lg:flex-col gap-4 lg:gap-2 lg:flex-1">
      {/* Connector line (vertical on mobile, horizontal on desktop) */}
      {!isLast && (
        <>
          {/* Mobile line */}
          <div 
            className={`absolute left-3 top-8 bottom-[-16px] w-[2px] lg:hidden ${
              isCompleted || isCurrent ? 'bg-primary-deep-navy' : 'bg-border'
            }`} 
          />
          {/* Desktop line */}
          <div 
            className={`hidden lg:block absolute left-1/2 right-[-50%] top-3 h-[2px] z-0 ${
              isCompleted || isCurrent ? 'bg-primary-deep-navy' : 'bg-border'
            }`} 
          />
        </>
      )}

      {/* Node Circle */}
      <div className="relative z-10 shrink-0 lg:mx-auto">
        {isCompleted && (
          <div className="w-6 h-6 rounded-full bg-primary-deep-navy text-white flex items-center justify-center">
            <Check size={14} strokeWidth={3} />
          </div>
        )}
        {isCurrent && (
          <div className="relative w-6 h-6 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-[#C5B190] opacity-30 animate-ping"></div>
            <div className="relative w-4 h-4 rounded-full bg-[#C5B190] border-2 border-white shadow-sm"></div>
          </div>
        )}
        {isUpcoming && (
          <div className="w-6 h-6 rounded-full bg-ivory-warm border-2 border-border flex items-center justify-center" />
        )}
      </div>

      {/* Text Content */}
      <div className="flex-1 lg:text-center pb-8 lg:pb-0 pt-0.5 lg:pt-2">
        <h3 className={`text-sm font-medium ${isCurrent || isCompleted ? 'text-primary-deep-navy' : 'text-slate'}`}>
          {step.label}
        </h3>
        <p className="text-xs text-slate mt-1 lg:mx-auto lg:max-w-[120px] hidden md:block">
          {step.description}
        </p>
        {(isCompleted || isCurrent) && dateStr && (
          <p className="text-xs font-medium text-slate mt-1.5">{dateStr}</p>
        )}
      </div>
    </div>
  );
};
