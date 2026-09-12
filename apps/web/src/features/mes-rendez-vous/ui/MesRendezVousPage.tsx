'use client';

import React from 'react';
import { useMyAppointments } from '../hooks/useMyAppointments';
import { AppointmentStatusFilterTabs } from './AppointmentStatusFilterTabs';
import { AppointmentTicketCard } from './AppointmentTicketCard';
import { EmptyAppointmentsState } from './EmptyAppointmentsState';
import { NewAppointmentButton } from './NewAppointmentButton';

export const MesRendezVousPage = () => {
  const { appointments, filter, setFilter } = useMyAppointments();

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl text-primary-deep-navy mb-2">
            Mes rendez-vous
          </h1>
          <p className="text-slate text-sm">
            Gérez vos essayages et prises de mesures en atelier.
          </p>
        </div>
        <NewAppointmentButton />
      </div>

      <AppointmentStatusFilterTabs currentFilter={filter} onFilterChange={setFilter} />

      <div className="space-y-4">
        {appointments.length === 0 ? (
          <EmptyAppointmentsState filter={filter} />
        ) : (
          appointments.map((apt) => (
            <AppointmentTicketCard key={apt.id} appointment={apt} />
          ))
        )}
      </div>
    </div>
  );
};
