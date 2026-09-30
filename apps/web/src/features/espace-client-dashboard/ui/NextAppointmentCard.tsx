import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, Clock, MapPin } from 'lucide-react';

export interface NextAppointmentCardData {
  id: string;
  scheduledAt: string;
  atelierName: string;
  atelierAddress: string;
}

interface NextAppointmentCardProps {
  appointment?: NextAppointmentCardData | null;
}

export const NextAppointmentCard: React.FC<NextAppointmentCardProps> = ({ appointment }) => {
  if (!appointment) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-border flex flex-col items-center justify-center text-center h-full min-h-[200px]">
        <div className="w-12 h-12 bg-angaly-ivory rounded-full flex items-center justify-center mb-4">
          <Calendar className="text-angaly-slate" size={24} />
        </div>
        <h3 className="font-medium text-angaly-navy mb-2">Aucun rendez-vous</h3>
        <p className="text-sm text-angaly-slate">Vous n'avez pas de rendez-vous à venir.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-border h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-angaly-ivory rounded-full flex items-center justify-center text-angaly-navy">
          <Calendar size={20} />
        </div>
        <h2 className="font-serif text-lg text-angaly-navy">Prochain rendez-vous</h2>
      </div>

      <div className="flex-1 space-y-4">
        <div>
          <p className="text-sm text-angaly-slate mb-1">Date & Heure</p>
          <div className="flex items-center gap-2 text-angaly-navy font-medium">
            <Clock size={16} className="text-angaly-slate" />
            {format(new Date(appointment.scheduledAt), "d MMMM yyyy, HH:mm", { locale: fr })}
          </div>
        </div>
        <div>
          <p className="text-sm text-angaly-slate mb-1">Lieu</p>
          <div className="flex items-start gap-2 text-angaly-navy font-medium">
            <MapPin size={16} className="text-angaly-slate shrink-0 mt-0.5" />
            <span>{appointment.atelierName}<br/><span className="text-sm font-normal text-angaly-slate">{appointment.atelierAddress}</span></span>
          </div>
        </div>
      </div>

      <Link href="/mes-rendez-vous" className="mt-6 text-sm font-medium text-angaly-navy hover:underline underline-offset-4">
        Voir les détails &rarr;
      </Link>
    </div>
  );
};
