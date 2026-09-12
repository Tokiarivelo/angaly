import React from 'react';
import Link from 'next/link';
import { Scissors, Ruler, Heart, FileText } from 'lucide-react';

const tiles = [
  { label: 'Mes créations', href: '/creations', icon: Scissors, color: 'bg-orange-50 text-orange-600' },
  { label: 'Mes mesures', href: '/mes-mesures', icon: Ruler, color: 'bg-blue-50 text-blue-600' },
  { label: 'Mes favoris', href: '/mes-favoris', icon: Heart, color: 'bg-pink-50 text-pink-600' },
  { label: 'Mes factures', href: '/mes-messages?tab=factures', icon: FileText, color: 'bg-green-50 text-green-600' },
];

export const QuickAccessTilesGrid: React.FC = () => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {tiles.map((tile) => {
        const Icon = tile.icon;
        return (
          <Link 
            key={tile.href} 
            href={tile.href}
            className="bg-white p-4 rounded-xl border border-border hover:border-primary-deep-navy transition-colors flex flex-col items-center justify-center text-center gap-3 group"
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${tile.color}`}>
              <Icon size={24} />
            </div>
            <span className="text-sm font-medium text-primary-deep-navy">{tile.label}</span>
          </Link>
        );
      })}
    </div>
  );
};
