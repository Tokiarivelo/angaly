import React from 'react';
import { Check } from 'lucide-react';
import type { CheckoutStep } from '../hooks/useCheckoutWizard';

const steps = [
  { id: 'expedition', label: 'Expédition' },
  { id: 'paiement', label: 'Paiement' },
  { id: 'confirmation', label: 'Confirmation' },
];

export const CheckoutStepper: React.FC<{ currentStep: CheckoutStep }> = ({ currentStep }) => {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="flex items-center justify-center mb-12">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isActive = index === currentIndex;
        const isLast = index === steps.length - 1;

        return (
          <React.Fragment key={step.id}>
            {/* Step */}
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors ${
                  isCompleted
                    ? 'bg-primary-deep-navy border-primary-deep-navy text-white'
                    : isActive
                      ? 'border-primary-deep-navy text-primary-deep-navy bg-white'
                      : 'border-border text-slate bg-ivory-warm'
                }`}
              >
                {isCompleted ? <Check size={16} /> : index + 1}
              </div>
              <span
                className={`text-sm font-medium ${
                  isCompleted || isActive ? 'text-primary-deep-navy' : 'text-slate'
                }`}
              >
                {step.label}
              </span>
            </div>
            {/* Connector */}
            {!isLast && (
              <div
                className={`w-12 sm:w-24 h-px mx-4 ${
                  isCompleted ? 'bg-primary-deep-navy' : 'bg-border'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
