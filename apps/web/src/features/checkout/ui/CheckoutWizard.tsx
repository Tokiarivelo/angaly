'use client';

import React from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { CheckoutStepper } from './CheckoutStepper';
import { useCheckoutWizard } from '../hooks/useCheckoutWizard';
import { ExpeditionStep } from './steps/ExpeditionStep';
import { PaiementStep } from './steps/PaiementStep';
import { ConfirmationStep } from './steps/ConfirmationStep';

export const CheckoutWizard = () => {
  const wizard = useCheckoutWizard();

  return (
    <div className="min-h-screen bg-ivory">
      {/* Minimal Header */}
      <header className="border-b border-border bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="font-serif text-2xl tracking-widest text-primary-deep-navy">
            ANGALY
          </Link>
          <div className="flex items-center gap-2 text-primary-deep-navy text-sm font-medium">
            <Lock size={16} />
            Paiement sécurisé
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <CheckoutStepper currentStep={wizard.step} />

        <div className="mt-8">
          {wizard.step === 'expedition' && <ExpeditionStep wizard={wizard} />}
          {wizard.step === 'paiement' && <PaiementStep wizard={wizard} />}
          {wizard.step === 'confirmation' && <ConfirmationStep wizard={wizard} />}
        </div>
      </main>
    </div>
  );
};
