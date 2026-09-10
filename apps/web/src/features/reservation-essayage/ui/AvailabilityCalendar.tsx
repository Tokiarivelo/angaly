'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { MonthAvailabilityDayDto } from '@angaly/types';

const WEEKDAY_LABELS = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];

interface AvailabilityCalendarProps {
  month: string;
  days: MonthAvailabilityDayDto[];
  isLoading: boolean;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
}

function monthLabel(month: string): string {
  const [year, monthIndex] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year ?? 0, (monthIndex ?? 1) - 1, 1));
  const label = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function leadingOffset(month: string): number {
  const [year, monthIndex] = month.split('-').map(Number);
  const firstOfMonth = new Date(Date.UTC(year ?? 0, (monthIndex ?? 1) - 1, 1));
  return (firstOfMonth.getUTCDay() + 6) % 7;
}

/**
 * Minimal navy/ivoire calendar — same data/logic as `prendre-rendez-vous`'s copy, but no
 * legend block underneath, matching the real Stitch screen exactly (see docs/pages/
 * reservation-essayage.md "Points d'attention": no separate legend element is rendered
 * there, unlike "ANGALY — Prendre rendez-vous (Booking)").
 */
export function AvailabilityCalendar({
  month,
  days,
  isLoading,
  selectedDate,
  onSelectDate,
  onPreviousMonth,
  onNextMonth,
}: AvailabilityCalendarProps) {
  const offset = leadingOffset(month);
  const cells: (MonthAvailabilityDayDto | null)[] = [...Array<null>(offset).fill(null), ...days];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-heading text-base text-angaly-navy">{monthLabel(month)}</h3>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Mois précédent"
            onClick={onPreviousMonth}
            className="text-angaly-slate transition-colors hover:text-angaly-navy"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Mois suivant"
            onClick={onNextMonth}
            className="text-angaly-slate transition-colors hover:text-angaly-navy"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-angaly-slate uppercase">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div role="grid" aria-label="Jours disponibles" className="mt-2 grid grid-cols-7 gap-1">
        {cells.map((day, index) => {
          if (!day) {
            return <span key={`empty-${index}`} aria-hidden="true" />;
          }
          const dayNumber = Number(day.date.slice(-2));
          const isSelected = day.date === selectedDate;
          const isSelectable = day.status === 'available';

          return (
            <button
              key={day.date}
              type="button"
              disabled={!isSelectable}
              onClick={() => onSelectDate(day.date)}
              aria-pressed={isSelected}
              className={`aspect-square rounded-sm text-sm transition-colors duration-200 ${
                isSelected
                  ? 'bg-angaly-navy font-medium text-white'
                  : isSelectable
                    ? 'cursor-pointer text-angaly-navy hover:bg-angaly-ivory'
                    : 'cursor-not-allowed text-angaly-warm-gray opacity-50'
              }`}
            >
              {dayNumber}
            </button>
          );
        })}
      </div>

      {isLoading && (
        <p className="mt-4 text-center text-xs text-angaly-slate" role="status">
          Chargement de la disponibilité…
        </p>
      )}
    </div>
  );
}
