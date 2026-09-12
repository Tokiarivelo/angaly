import React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface WelcomeHeaderProps {
  firstName: string;
}

export const WelcomeHeader: React.FC<WelcomeHeaderProps> = ({ firstName }) => {
  const today = format(new Date(), 'EEEE d MMMM yyyy', { locale: fr });
  
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
      <div>
        <p className="text-sm text-slate mb-1 capitalize">{today}</p>
        <h1 className="font-serif text-3xl md:text-4xl text-primary-deep-navy">
          Bonjour, {firstName}
        </h1>
      </div>
      <Link 
        href="/rendez-vous" 
        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-deep-navy text-white rounded-full font-medium hover:bg-primary-dark transition-colors shrink-0"
      >
        <Plus size={18} />
        Prendre rendez-vous
      </Link>
    </div>
  );
};
