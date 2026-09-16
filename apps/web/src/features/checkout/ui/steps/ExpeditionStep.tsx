'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CheckoutState } from '../../hooks/useCheckoutWizard';
import { CheckoutOrderSummarySidebar } from '../CheckoutOrderSummarySidebar';
import { useCartStore } from '@/stores/cart.store';
import { REDIRECT_TO_PARAM } from '@/features/authentification/consts/queryKeys';
import { ROUTES } from '@/lib/routes';

export const ExpeditionStep: React.FC<{ wizard: CheckoutState }> = ({ wizard }) => {
  const { items } = useCartStore();
  const router = useRouter();
  const [deliveryMethod, setDeliveryMethod] = useState<'domicile' | 'atelier'>('domicile');
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    adresse: '',
    ville: '',
    region: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();

    // `POST /api/orders` requires an authenticated CLIENT — guest checkout
    // isn't implemented server-side (see docs/pages/checkout.md).
    if (!wizard.isAuthenticated) {
      router.push(`${ROUTES.connexion}?${REDIRECT_TO_PARAM}=${encodeURIComponent('/checkout')}`);
      return;
    }

    try {
      await wizard.createOrder({ ...formData, method: deliveryMethod });
    } catch {
      // Surfaced to the user via `wizard.createOrderError` below.
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
      <div className="flex-1">
        <form onSubmit={(e) => void handleContinue(e)} className="space-y-8">
          <section className="bg-white p-6 md:p-8 rounded-xl border border-border">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-serif text-2xl text-primary-deep-navy">Coordonnées</h2>
              <span className="text-sm text-slate">
                Déjà client ?{' '}
                <a href={ROUTES.connexion} className="text-primary-deep-navy font-medium underline underline-offset-2">
                  Connectez-vous
                </a>
              </span>
            </div>

            {!wizard.isAuthenticated && (
              <p className="mb-6 rounded-md bg-ivory-warm border border-border px-4 py-3 text-sm text-slate">
                Une connexion est nécessaire pour finaliser votre commande. Vous serez invité(e) à
                vous connecter en cliquant sur « Continuer vers le paiement ».
              </p>
            )}

            {wizard.createOrderError && (
              <p role="alert" className="mb-6 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {wizard.createOrderError}
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary-deep-navy">Prénom</label>
                <input required name="prenom" value={formData.prenom} onChange={handleChange} className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-deep-navy" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary-deep-navy">Nom</label>
                <input required name="nom" value={formData.nom} onChange={handleChange} className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-deep-navy" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary-deep-navy">Email</label>
                <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-deep-navy" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary-deep-navy">Téléphone</label>
                <input required type="tel" name="telephone" value={formData.telephone} onChange={handleChange} className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-deep-navy" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-primary-deep-navy">Adresse de livraison</label>
                <input required name="adresse" value={formData.adresse} onChange={handleChange} className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-deep-navy" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary-deep-navy">Ville</label>
                <input required name="ville" value={formData.ville} onChange={handleChange} className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-deep-navy" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary-deep-navy">Région</label>
                <input required name="region" value={formData.region} onChange={handleChange} className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-deep-navy" />
              </div>
            </div>
          </section>

          <section className="bg-white p-6 md:p-8 rounded-xl border border-border">
            <h2 className="font-serif text-2xl text-primary-deep-navy mb-6">Mode de livraison</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className={`relative flex flex-col p-4 border rounded-xl cursor-pointer transition-colors ${deliveryMethod === 'domicile' ? 'border-primary-deep-navy bg-ivory-warm' : 'border-border hover:border-slate'}`}>
                <input type="radio" name="deliveryMethod" value="domicile" checked={deliveryMethod === 'domicile'} onChange={() => setDeliveryMethod('domicile')} className="absolute opacity-0" />
                <span className="font-medium text-primary-deep-navy">Livraison à domicile</span>
                <span className="text-sm text-slate mt-1">2 à 3 jours ouvrables</span>
                <span className="font-medium text-primary-deep-navy mt-4">15 000 MGA</span>
              </label>
              <label className={`relative flex flex-col p-4 border rounded-xl cursor-pointer transition-colors ${deliveryMethod === 'atelier' ? 'border-primary-deep-navy bg-ivory-warm' : 'border-border hover:border-slate'}`}>
                <input type="radio" name="deliveryMethod" value="atelier" checked={deliveryMethod === 'atelier'} onChange={() => setDeliveryMethod('atelier')} className="absolute opacity-0" />
                <span className="font-medium text-primary-deep-navy">Retrait en atelier</span>
                <span className="text-sm text-slate mt-1">Dès aujourd'hui à Antananarivo</span>
                <span className="font-medium text-primary-deep-navy mt-4">Gratuit</span>
              </label>
            </div>
          </section>

          <div className="flex justify-between items-center pt-4">
            <a href="/panier" className="text-primary-deep-navy font-medium underline underline-offset-2 text-sm">
              Retour au panier
            </a>
            <button
              type="submit"
              disabled={wizard.isCreatingOrder || items.length === 0}
              className="px-8 py-3 bg-primary-deep-navy text-white font-medium rounded-full hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {wizard.isCreatingOrder ? 'Validation...' : 'Continuer vers le paiement'}
            </button>
          </div>
        </form>
      </div>

      <div className="w-full lg:w-4/12 xl:w-3/12">
        <CheckoutOrderSummarySidebar shippingCost={deliveryMethod === 'domicile' ? 15000 : 0} />
      </div>
    </div>
  );
};
