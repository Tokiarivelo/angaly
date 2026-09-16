'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import type { CheckoutState } from '../../hooks/useCheckoutWizard';

export const ConfirmationStep: React.FC<{ wizard: CheckoutState }> = ({ wizard }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 max-w-2xl mx-auto text-center px-4">
      <CheckCircle2 className="w-20 h-20 text-[#C5B190] mb-8" />
      <h1 className="font-serif text-3xl md:text-5xl text-primary-deep-navy mb-4">
        Merci pour votre commande
      </h1>
      <p className="text-slate mb-8">
        Votre commande <strong className="text-primary-deep-navy">#{wizard.order?.orderNumber ?? ''}</strong> a bien été enregistrée.
        Un email de confirmation vous a été envoyé.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <Link
          href={wizard.order ? `/suivi-commande/${wizard.order.orderNumber}` : '/espace-client'}
          className="px-8 py-3 bg-primary-deep-navy text-white font-medium rounded-full hover:bg-primary-dark transition-colors"
        >
          Voir ma commande
        </Link>
        <Link
          href="/"
          className="px-8 py-3 border border-primary-deep-navy text-primary-deep-navy font-medium rounded-full hover:bg-ivory transition-colors"
        >
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
};
