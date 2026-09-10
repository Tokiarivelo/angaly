'use client';

import type { AppointmentType } from '@angaly/types';

import { APPOINTMENT_TYPE_OPTIONS } from '../consts/appointment-types.const';

interface AppointmentTypeChipsProps {
  selectedType: AppointmentType | '';
  onSelect: (type: AppointmentType) => void;
}

/** Section 1 — "1. Type de création" chip group (7 types, verified on the real Stitch screen). */
export function AppointmentTypeChips({ selectedType, onSelect }: AppointmentTypeChipsProps) {
  return (
    <div role="radiogroup" aria-label="Type de création" className="flex flex-wrap gap-3">
      {APPOINTMENT_TYPE_OPTIONS.map((option) => {
        const isSelected = option.value === selectedType;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelect(option.value)}
            className={`border px-4 py-2 text-sm transition-colors duration-300 ${
              isSelected
                ? 'border-angaly-navy bg-angaly-navy text-white'
                : 'border-angaly-border bg-transparent text-angaly-navy hover:border-angaly-gold'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
