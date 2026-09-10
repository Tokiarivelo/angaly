'use client';

import { useMemo, useState } from 'react';
import type { MonthAvailabilityDayDto } from '@angaly/types';

import { useDaySlotsQuery, useMonthAvailabilityQuery } from '../api/appointments.api';

function currentMonthValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function shiftMonth(month: string, delta: number): string {
  const [year, monthIndex] = month.split('-').map(Number);
  const shifted = new Date(Date.UTC(year ?? 0, (monthIndex ?? 1) - 1 + delta, 1));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, '0')}`;
}

export interface UseAvailabilityResult {
  month: string;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  days: MonthAvailabilityDayDto[];
  isLoadingDays: boolean;
  selectedDate: string | null;
  selectDate: (date: string) => void;
  slots: string[];
  isLoadingSlots: boolean;
}

/**
 * Same logic as `prendre-rendez-vous`'s own copy — duplicated per feature-sliced isolation
 * (see docs/pages/reservation-essayage.md "Points d'attention": factoring was considered and
 * declined, consistent with this codebase's established preference for feature-local copies
 * over cross-feature imports, e.g. `buildDirectionsUrl` in `atelier-detail`/
 * `nos-ateliers-liste`/`confirmation-rendez-vous`).
 */
export function useAvailability(atelierId: string): UseAvailabilityResult {
  const [month, setMonth] = useState(currentMonthValue);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const monthAvailabilityQuery = useMonthAvailabilityQuery(atelierId, month);
  const daySlotsQuery = useDaySlotsQuery(atelierId, selectedDate ?? '');

  const days = useMemo(() => monthAvailabilityQuery.data ?? [], [monthAvailabilityQuery.data]);
  const slots = useMemo(() => daySlotsQuery.data?.slots ?? [], [daySlotsQuery.data]);

  return {
    month,
    goToPreviousMonth: () => setMonth((current) => shiftMonth(current, -1)),
    goToNextMonth: () => setMonth((current) => shiftMonth(current, 1)),
    days,
    isLoadingDays: monthAvailabilityQuery.isLoading,
    selectedDate,
    selectDate: setSelectedDate,
    slots,
    isLoadingSlots: daySlotsQuery.isLoading,
  };
}
