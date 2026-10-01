import React from 'react';
import Link from 'next/link';
import { Package, ArrowRight } from 'lucide-react';
import { OrderStatus } from '@angaly/types';
import { ROUTES } from '@/lib/routes';

export interface CurrentOrderCardData {
  id: string; // orderNumber
  status: OrderStatus;
  createdAt: string;
}

interface CurrentOrderCardProps {
  order?: CurrentOrderCardData | null;
}

const ORDER_STATUS_LABELS: Record<OrderStatus, { label: string; step: string }> = {
  [OrderStatus.PENDING]: { label: 'En attente', step: 'En attente de paiement' },
  [OrderStatus.CONFIRMED]: { label: 'Confirmée', step: 'Commande enregistrée' },
  [OrderStatus.PAID]: { label: 'Payée', step: 'En préparation dans nos ateliers' },
  [OrderStatus.IN_PRODUCTION]: { label: 'En confection', step: 'Dernière étape : Broderie & Finitions' },
  [OrderStatus.READY]: { label: 'Prête', step: 'Prête pour livraison' },
  [OrderStatus.DELIVERED]: { label: 'Livrée', step: 'Commande livrée' },
  [OrderStatus.CANCELLED]: { label: 'Annulée', step: 'Commande annulée' },
  [OrderStatus.REFUNDED]: { label: 'Remboursée', step: 'Commande remboursée' },
};

export const CurrentOrderCard: React.FC<CurrentOrderCardProps> = ({ order }) => {
  if (!order) {
    return (
      <div className="bg-white border border-angaly-border p-6 flex flex-col justify-between hover:border-angaly-champagne transition-colors duration-300 group h-full min-h-[220px]">
        <div className="flex justify-between items-start mb-4">
          <Package className="text-angaly-champagne" size={22} />
          <span className="text-[10px] font-sans tracking-widest uppercase text-angaly-slate bg-angaly-warm-ivory/20 px-2 py-0.5 rounded font-medium">
            Panier vide
          </span>
        </div>
        <div className="my-auto">
          <h3 className="font-heading text-base text-angaly-navy mb-1 group-hover:text-angaly-gold transition-colors font-medium">
            Aucune commande
          </h3>
          <p className="text-xs text-angaly-slate leading-relaxed">
            Vous n'avez pas de commande de création en cours.
          </p>
        </div>
        <Link
          href={ROUTES.creations}
          className="mt-4 pt-3 border-t border-angaly-border/50 text-xs font-sans tracking-wider uppercase text-angaly-soft-navy hover:text-angaly-navy flex items-center gap-1 font-medium transition-colors"
        >
          <span>Découvrir nos créations</span>
          <ArrowRight size={13} />
        </Link>
      </div>
    );
  }

  const statusInfo = ORDER_STATUS_LABELS[order.status] ?? {
    label: 'En cours',
    step: 'Confection en atelier',
  };

  return (
    <div className="bg-white border border-angaly-border p-6 flex flex-col justify-between hover:border-angaly-champagne transition-colors duration-300 group h-full min-h-[220px]">
      <div className="flex justify-between items-start mb-4">
        <Package className="text-angaly-champagne" size={22} />
        <span className="text-[10px] font-sans tracking-widest uppercase text-angaly-gold bg-angaly-champagne/20 px-2 py-0.5 rounded font-medium">
          {statusInfo.label}
        </span>
      </div>

      <div className="flex items-center gap-4 my-auto">
        {/* Navy silk swatch thumbnail */}
        <div className="w-12 h-16 bg-angaly-navy-dark border border-angaly-border/80 shrink-0 flex flex-col items-center justify-center relative overflow-hidden shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-angaly-navy via-angaly-navy-blue to-angaly-royal-navy opacity-90" />
          <div className="absolute -right-3 -top-3 w-8 h-8 rounded-full bg-angaly-champagne/10 blur-sm" />
          <span className="relative font-heading text-[9px] tracking-widest text-angaly-champagne uppercase opacity-80">
            ANGALY
          </span>
        </div>

        <div className="min-w-0">
          <h3 className="font-heading text-base text-angaly-navy leading-tight mb-1 group-hover:text-angaly-gold transition-colors font-medium truncate">
            Commande #{order.id}
          </h3>
          <p className="text-xs text-angaly-warm-gray leading-normal">
            {statusInfo.step}
          </p>
        </div>
      </div>

      <Link
        href={`/suivi-commande/${order.id}`}
        className="mt-4 pt-3 border-t border-angaly-border/50 text-xs font-sans tracking-wider uppercase text-angaly-soft-navy hover:text-angaly-navy flex items-center gap-1 font-medium transition-colors"
      >
        <span>Suivre ma commande</span>
        <ArrowRight size={13} />
      </Link>
    </div>
  );
};
