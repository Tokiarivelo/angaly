import React from 'react';
import Link from 'next/link';
import { Calendar, Clock, MapPin } from 'lucide-react';

interface NextAppointmentCardProps {
  appointment?: any;
}

export const NextAppointmentCard: React.FC<NextAppointmentCardProps> = ({ appointment }) => {
  if (!appointment) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-border flex flex-col items-center justify-center text-center h-full min-h-[200px]">
        <div className="w-12 h-12 bg-ivory-warm rounded-full flex items-center justify-center mb-4">
          <Calendar className="text-slate" size={24} />
        </div>
        <h3 className="font-medium text-primary-deep-navy mb-2">Aucun rendez-vous</h3>
        <p className="text-sm text-slate">Vous n'avez pas de rendez-vous à venir.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-border h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-ivory-warm rounded-full flex items-center justify-center text-primary-deep-navy">
          <Calendar size={20} />
        </div>
        <h2 className="font-serif text-lg text-primary-deep-navy">Prochain rendez-vous</h2>
      </div>

      <div className="flex-1 space-y-4">
        <div>
          <p className="text-sm text-slate mb-1">Date & Heure</p>
          <div className="flex items-center gap-2 text-primary-deep-navy font-medium">
            <Clock size={16} className="text-slate" />
            24 Septembre 2026, 14:30
          </div>
        </div>
        <div>
          <p className="text-sm text-slate mb-1">Lieu</p>
          <div className="flex items-start gap-2 text-primary-deep-navy font-medium">
            <MapPin size={16} className="text-slate shrink-0 mt-0.5" />
            <span>Atelier ANGALY<br/><span className="text-sm font-normal text-slate">Analakely, Antananarivo</span></span>
          </div>
        </div>
      </div>

      <Link href="/mes-rendez-vous" className="mt-6 text-sm font-medium text-primary-deep-navy hover:underline underline-offset-4">
        Voir les détails &rarr;
      </Link>
    </div>
  );
};
