import React from 'react';
import Link from 'next/link';
import { CalendarPlus } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { ROUTES } from '@/lib/routes';

interface WelcomeHeaderProps {
  firstName: string;
}

export const WelcomeHeader: React.FC<WelcomeHeaderProps> = ({ firstName }) => {
  const todayFormatted = format(new Date(), 'd MMMM yyyy', { locale: fr }).toUpperCase();

  return (
    <header className="px-6 sm:px-8 lg:px-12 py-8 sm:py-10 flex flex-col sm:flex-row sm:items-end justify-between border-b border-angaly-border bg-angaly-ivory/80 backdrop-blur-sm sticky top-0 z-20 gap-4">
      <div>
        <p className="text-angaly-warm-gray font-sans text-xs tracking-widest uppercase mb-1.5 font-medium">
          {todayFormatted}
        </p>
        <h1 className="font-heading text-3xl sm:text-4xl text-angaly-navy tracking-wide font-normal">
          Bonjour, {firstName || 'Chère Cliente'}
        </h1>
      </div>

      <Link
        href={ROUTES.prendreRendezVous}
        className="bg-angaly-navy hover:bg-angaly-navy-blue text-white px-6 py-3 font-sans text-xs uppercase tracking-widest transition-colors duration-300 flex items-center justify-center gap-2.5 border border-angaly-navy shrink-0 font-medium self-start sm:self-auto"
      >
        <CalendarPlus size={16} />
        <span>Prendre rendez-vous</span>
      </Link>
    </header>
  );
};
