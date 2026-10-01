import React from 'react';
import Link from 'next/link';
import { Scissors, Ruler, Heart, FileText } from 'lucide-react';
import { ROUTES } from '@/lib/routes';

const tiles = [
  { label: 'Mes créations', href: ROUTES.mesCreations, icon: Scissors },
  { label: 'Mes mesures', href: '/mes-mesures', icon: Ruler },
  { label: 'Mes favoris', href: '/mes-favoris', icon: Heart },
  { label: 'Mes factures', href: '/mes-messages?tab=factures', icon: FileText },
];

export const QuickAccessTilesGrid: React.FC = () => {
  return (
    <div className="grid grid-cols-2 gap-4">
      {tiles.map((tile) => {
        const Icon = tile.icon;
        return (
          <Link
            key={tile.label}
            href={tile.href}
            className="group block border border-angaly-border bg-white p-6 sm:p-8 text-center hover:bg-angaly-navy transition-colors duration-300"
          >
            <Icon
              size={32}
              className="mx-auto text-angaly-soft-navy group-hover:text-angaly-champagne mb-4 transition-colors stroke-[1.5]"
            />
            <h3 className="font-sans text-xs sm:text-sm uppercase tracking-wider text-angaly-navy group-hover:text-angaly-ivory transition-colors font-medium">
              {tile.label}
            </h3>
          </Link>
        );
      })}
    </div>
  );
};
