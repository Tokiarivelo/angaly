import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MapPin, Clock } from 'lucide-react';
import type { Appointment } from '../hooks/useMyAppointments';
import { AppointmentStatusBadge } from './AppointmentStatusBadge';
import { AppointmentActionsMenu } from './AppointmentActionsMenu';

interface Props {
  appointment: Appointment;
}

export const AppointmentTicketCard: React.FC<Props> = ({ appointment }) => {
  const dateObj = new Date(appointment.scheduledAt);
  const day = format(dateObj, 'dd');
  const month = format(dateObj, 'MMM', { locale: fr }).toUpperCase();
  const time = format(dateObj, 'HH:mm');
  const fullDate = format(dateObj, 'EEEE d MMMM yyyy', { locale: fr });

  return (
    <div className="bg-white border border-border rounded-2xl flex flex-col sm:flex-row overflow-hidden hover:border-primary-deep-navy transition-colors group">
      {/* Date Block (Ticket Stub) */}
      <div className="bg-ivory-warm w-full sm:w-32 flex flex-row sm:flex-col items-center justify-center p-4 sm:border-r border-border border-dashed shrink-0">
        <span className="text-3xl font-serif text-primary-deep-navy">{day}</span>
        <span className="text-sm font-medium text-slate ml-2 sm:ml-0">{month}</span>
      </div>

      {/* Content Block */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-slate uppercase">{appointment.reference}</span>
              <AppointmentStatusBadge status={appointment.status} />
            </div>
            <h3 className="font-serif text-xl text-primary-deep-navy">{appointment.type}</h3>
          </div>
          <AppointmentActionsMenu appointment={appointment} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-2 text-sm text-slate">
            <Clock size={16} className="shrink-0 mt-0.5 text-primary-deep-navy" />
            <span>
              {fullDate} <br /> à {time}
            </span>
          </div>
          <div className="flex items-start gap-2 text-sm text-slate">
            <MapPin size={16} className="shrink-0 mt-0.5 text-primary-deep-navy" />
            <span>
              <strong className="font-medium text-primary-deep-navy">{appointment.atelierName}</strong><br />
              {appointment.atelierAddress}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
