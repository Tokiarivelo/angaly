import React from 'react';
import { CalendarX } from 'lucide-react';
import type { AppointmentFilter } from '../hooks/useMyAppointments';

interface Props {
  filter: AppointmentFilter;
}

export const EmptyAppointmentsState: React.FC<Props> = ({ filter }) => {
  const messages = {
    upcoming: "Vous n'avez aucun rendez-vous à venir.",
    past: "Vous n'avez aucun rendez-vous passé.",
    cancelled: "Vous n'avez aucun rendez-vous annulé.",
  };

  return (
    <div className="bg-white border border-border rounded-2xl p-12 flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 bg-ivory-warm rounded-full flex items-center justify-center text-slate mb-4">
        <CalendarX size={32} />
      </div>
      <h3 className="font-serif text-xl text-primary-deep-navy mb-2">Aucun rendez-vous</h3>
      <p className="text-slate">{messages[filter]}</p>
    </div>
  );
};
