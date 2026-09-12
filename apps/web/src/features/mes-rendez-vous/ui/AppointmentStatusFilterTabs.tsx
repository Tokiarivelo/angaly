import React from 'react';
import type { AppointmentFilter } from '../hooks/useMyAppointments';

interface Props {
  currentFilter: AppointmentFilter;
  onFilterChange: (f: AppointmentFilter) => void;
}

export const AppointmentStatusFilterTabs: React.FC<Props> = ({ currentFilter, onFilterChange }) => {
  const tabs: { value: AppointmentFilter; label: string }[] = [
    { value: 'upcoming', label: 'À venir' },
    { value: 'past', label: 'Passés' },
    { value: 'cancelled', label: 'Annulés' },
  ];

  return (
    <div className="flex space-x-1 bg-white border border-border p-1 rounded-lg w-full md:w-fit">
      {tabs.map((tab) => {
        const isActive = currentFilter === tab.value;
        return (
          <button
            key={tab.value}
            onClick={() => onFilterChange(tab.value)}
            className={`flex-1 md:flex-none px-6 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive
                ? 'bg-primary-deep-navy text-white shadow'
                : 'text-slate hover:bg-ivory-warm'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
