import React, { useState } from 'react';
import Link from 'next/link';
import { MoreVertical, CalendarPlus, Edit2, XCircle } from 'lucide-react';
import { AppointmentStatus } from '@angaly/types';
import type { Appointment } from '../hooks/useMyAppointments';
import { useCancelAppointment } from '../hooks/useCancelAppointment';
import { useAddToCalendar } from '../hooks/useAddToCalendar';

interface Props {
  appointment: Appointment;
}

export const AppointmentActionsMenu: React.FC<Props> = ({ appointment }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { cancel } = useCancelAppointment();
  const { generateICS } = useAddToCalendar();

  const isUpcoming = appointment.status === AppointmentStatus.CONFIRMED || appointment.status === AppointmentStatus.PENDING;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-ivory-warm text-slate transition-colors"
      >
        <MoreVertical size={20} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-border rounded-xl shadow-lg py-1 z-10">
          <button
            onClick={() => {
              generateICS(appointment);
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-primary-deep-navy hover:bg-ivory-warm flex items-center gap-2"
          >
            <CalendarPlus size={16} />
            Ajouter au calendrier
          </button>
          
          {isUpcoming && (
            <>
              <Link
                href={`/prendre-rendez-vous?ref=${appointment.reference}`}
                className="w-full text-left px-4 py-2 text-sm text-primary-deep-navy hover:bg-ivory-warm flex items-center gap-2"
              >
                <Edit2 size={16} />
                Modifier le rendez-vous
              </Link>
              <button
                onClick={() => {
                  if (confirm('Voulez-vous vraiment annuler ce rendez-vous ?')) {
                    void cancel(appointment.reference).then(() => setIsOpen(false));
                  }
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <XCircle size={16} />
                Annuler
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
