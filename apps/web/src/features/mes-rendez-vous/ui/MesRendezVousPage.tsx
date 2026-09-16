'use client';

import React from 'react';
import { useMyAppointments } from '../hooks/useMyAppointments';
import { AppointmentStatusFilterTabs } from './AppointmentStatusFilterTabs';
import { AppointmentTicketCard } from './AppointmentTicketCard';
import { EmptyAppointmentsState } from './EmptyAppointmentsState';
import { NewAppointmentButton } from './NewAppointmentButton';

export const MesRendezVousPage = () => {
  const { appointments, filter, setFilter, isLoading, isError } = useMyAppointments();

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
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-32 bg-ivory-warm rounded-2xl" />
            ))}
          </div>
        ) : isError ? (
          <div className="bg-white border border-border rounded-2xl p-12 text-center text-slate">
            Une erreur est survenue lors du chargement de vos rendez-vous.
          </div>
        ) : appointments.length === 0 ? (
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
