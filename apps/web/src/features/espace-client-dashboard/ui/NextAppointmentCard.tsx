import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';
import { ROUTES } from '@/lib/routes';

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
      <div className="bg-white border border-angaly-border p-6 flex flex-col justify-between hover:border-angaly-champagne transition-colors duration-300 group h-full min-h-[220px]">
        <div className="flex justify-between items-start mb-4">
          <Calendar className="text-angaly-champagne" size={22} />
          <span className="text-[10px] font-sans tracking-widest uppercase text-angaly-slate bg-angaly-warm-ivory/20 px-2 py-0.5 rounded font-medium">
            À planifier
          </span>
        </div>
        <div className="my-auto">
          <h3 className="font-heading text-base text-angaly-navy mb-1 group-hover:text-angaly-gold transition-colors font-medium">
            Aucun rendez-vous
          </h3>
          <p className="text-xs text-angaly-slate leading-relaxed">
            Vous n'avez pas de rendez-vous à venir dans nos ateliers.
          </p>
        </div>
        <Link
          href={ROUTES.prendreRendezVous}
          className="mt-4 pt-3 border-t border-angaly-border/50 text-xs font-sans tracking-wider uppercase text-angaly-soft-navy hover:text-angaly-navy flex items-center gap-1 font-medium transition-colors"
        >
          <span>Prendre rendez-vous</span>
          <ArrowRight size={13} />
        </Link>
      </div>
    );
  }

  const dateFormatted = format(new Date(appointment.scheduledAt), "d MMMM, HH:mm", { locale: fr });

  return (
    <div className="bg-white border border-angaly-border p-6 flex flex-col justify-between hover:border-angaly-champagne transition-colors duration-300 group h-full min-h-[220px]">
      <div className="flex justify-between items-start mb-4">
        <Calendar className="text-angaly-champagne" size={22} />
        <span className="text-[10px] font-sans tracking-widest uppercase text-angaly-soft-navy bg-angaly-warm-ivory/30 px-2 py-0.5 rounded font-medium">
          Confirmé
        </span>
      </div>

      <div className="my-auto">
        <h3 className="font-heading text-lg text-angaly-navy mb-1 group-hover:text-angaly-gold transition-colors font-medium">
          {dateFormatted}
        </h3>
        <p className="text-xs text-angaly-slate mb-2">
          Robe de mariée sur mesure
        </p>
        <p className="text-xs text-angaly-warm-gray flex items-center gap-1.5">
          <MapPin size={13} className="text-angaly-warm-gray shrink-0" />
          <span className="truncate">{appointment.atelierName}</span>
        </p>
      </div>

      <Link
        href="/mes-rendez-vous"
        className="mt-4 pt-3 border-t border-angaly-border/50 text-xs font-sans tracking-wider uppercase text-angaly-soft-navy hover:text-angaly-navy flex items-center gap-1 font-medium transition-colors"
      >
        <span>Voir les détails</span>
        <ArrowRight size={13} />
      </Link>
    </div>
  );
};
