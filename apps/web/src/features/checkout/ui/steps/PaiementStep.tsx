'use client';

import React, { useState } from 'react';
import type { CheckoutState } from '../../hooks/useCheckoutWizard';
import { CheckoutOrderSummarySidebar } from '../CheckoutOrderSummarySidebar';
import { CreditCard, Smartphone, Building2, PackageOpen } from 'lucide-react';
import { useCartStore } from '@/stores/cart.store';

export const PaiementStep: React.FC<{ wizard: CheckoutState }> = ({ wizard }) => {
  const { clear } = useCartStore();
  const [paymentMethod, setPaymentMethod] = useState<'mobile' | 'card' | 'wire' | 'cash'>('mobile');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePayment = async () => {
    setIsSubmitting(true);
    try {
      // For now, simulate payment delay and success
      await new Promise(r => setTimeout(r, 1500));
      clear(); // clear cart upon successful payment
      wizard.setStep('confirmation');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
      <div className="flex-1 space-y-8">
        <section className="bg-white p-6 md:p-8 rounded-xl border border-border">
          <h2 className="font-serif text-2xl text-primary-deep-navy mb-6">Moyen de paiement</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className={`relative flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${paymentMethod === 'mobile' ? 'border-primary-deep-navy bg-ivory-warm' : 'border-border hover:border-slate'}`}>
              <input type="radio" name="payment" value="mobile" checked={paymentMethod === 'mobile'} onChange={() => setPaymentMethod('mobile')} className="absolute opacity-0" />
              <Smartphone className={`w-6 h-6 mr-4 ${paymentMethod === 'mobile' ? 'text-primary-deep-navy' : 'text-slate'}`} />
              <span className="font-medium text-primary-deep-navy">Mobile Money</span>
            </label>
            <label className={`relative flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${paymentMethod === 'card' ? 'border-primary-deep-navy bg-ivory-warm' : 'border-border hover:border-slate'}`}>
              <input type="radio" name="payment" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} className="absolute opacity-0" />
              <CreditCard className={`w-6 h-6 mr-4 ${paymentMethod === 'card' ? 'text-primary-deep-navy' : 'text-slate'}`} />
              <span className="font-medium text-primary-deep-navy">Carte Bancaire</span>
            </label>
            <label className={`relative flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${paymentMethod === 'wire' ? 'border-primary-deep-navy bg-ivory-warm' : 'border-border hover:border-slate'}`}>
              <input type="radio" name="payment" value="wire" checked={paymentMethod === 'wire'} onChange={() => setPaymentMethod('wire')} className="absolute opacity-0" />
              <Building2 className={`w-6 h-6 mr-4 ${paymentMethod === 'wire' ? 'text-primary-deep-navy' : 'text-slate'}`} />
              <span className="font-medium text-primary-deep-navy">Virement bancaire</span>
            </label>
            <label className={`relative flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${paymentMethod === 'cash' ? 'border-primary-deep-navy bg-ivory-warm' : 'border-border hover:border-slate'}`}>
              <input type="radio" name="payment" value="cash" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} className="absolute opacity-0" />
              <PackageOpen className={`w-6 h-6 mr-4 ${paymentMethod === 'cash' ? 'text-primary-deep-navy' : 'text-slate'}`} />
              <span className="font-medium text-primary-deep-navy">Paiement à la livraison</span>
            </label>
          </div>
        </section>

        <div className="flex justify-between items-center pt-4">
          <button
            type="button"
            onClick={() => wizard.setStep('expedition')}
            className="text-primary-deep-navy font-medium underline underline-offset-2 text-sm"
          >
            Retour à l'expédition
          </button>
          <button
            type="button"
            onClick={handlePayment}
            disabled={isSubmitting}
            className="px-8 py-3 bg-primary-deep-navy text-white font-medium rounded-full hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Traitement en cours...' : 'Confirmer et payer'}
          </button>
        </div>
      </div>

      <div className="w-full lg:w-4/12 xl:w-3/12">
        <CheckoutOrderSummarySidebar shippingCost={15000} />
      </div>
    </div>
  );
};
