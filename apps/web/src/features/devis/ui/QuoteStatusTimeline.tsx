import { QuoteStatus } from '@angaly/types';
import { Check } from 'lucide-react';

interface QuoteStatusTimelineProps {
  status: QuoteStatus;
}

export const QuoteStatusTimeline = ({ status }: QuoteStatusTimelineProps) => {
  // Mapping business states to a linear flow
  // Demande de devis → Analyse → Proposition → Acceptation → Acompte → Production
  const steps = [
    { label: 'Demande', key: 'request' },
    { label: 'Analyse', key: 'analysis' },
    { label: 'Proposition', key: 'proposal' },
    { label: 'Acceptation', key: 'acceptance' },
  ];

  // Determine current active step based on status
  let currentStepIndex = 2; // Default to 'Proposition' (SENT/VIEWED)
  
  if (status === QuoteStatus.ACCEPTED) {
    currentStepIndex = 3;
  } else if (status === QuoteStatus.REJECTED || status === QuoteStatus.EXPIRED) {
    currentStepIndex = 2; // Stuck at proposal
  }

  return (
    <div className="py-8">
      <div className="relative">
        {/* Progress bar background */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 -translate-y-1/2 bg-border"></div>
        
        {/* Active progress bar */}
        <div 
          className="absolute top-1/2 left-0 h-0.5 -translate-y-1/2 bg-navy-deep transition-all duration-500 ease-in-out"
          style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
        ></div>

        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isRejected = status === QuoteStatus.REJECTED && isCurrent;
            const isExpired = status === QuoteStatus.EXPIRED && isCurrent;
            
            return (
              <div key={step.key} className="flex flex-col items-center">
                <div 
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors duration-300 z-10 bg-white ${
                    isCompleted 
                      ? 'border-navy-deep bg-navy-deep text-white' 
                      : isCurrent
                        ? isRejected || isExpired
                          ? 'border-red-500 bg-red-50 text-red-500'
                          : 'border-navy-deep border-4'
                        : 'border-border text-gray-warm'
                  }`}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : <span className="h-2 w-2 rounded-full" />}
                </div>
                <span 
                  className={`mt-3 text-xs font-medium md:text-sm ${
                    isCompleted || isCurrent 
                      ? isRejected || isExpired ? 'text-red-600' : 'text-navy-deep' 
                      : 'text-gray-warm'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
