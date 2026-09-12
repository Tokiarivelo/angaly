import React from 'react';
import type { AppointmentStatus } from '../hooks/useMyAppointments';

interface Props {
  status: AppointmentStatus;
}

export const AppointmentStatusBadge: React.FC<Props> = ({ status }) => {
  const configs: Record<AppointmentStatus, { label: string; classes: string }> = {
    CONFIRMED: { label: 'Confirmé', classes: 'bg-green-100 text-green-700' },
    PENDING: { label: 'En attente', classes: 'bg-orange-100 text-orange-700' },
    CANCELLED: { label: 'Annulé', classes: 'bg-red-100 text-red-700' },
    NO_SHOW: { label: 'Non honoré', classes: 'bg-slate text-white' },
    COMPLETED: { label: 'Terminé', classes: 'bg-blue-100 text-blue-700' },
  };

  const config = configs[status];

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${config.classes}`}>
      {config.label}
    </span>
  );
};
