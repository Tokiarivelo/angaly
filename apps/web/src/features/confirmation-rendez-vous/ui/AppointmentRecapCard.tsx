import type { ReactNode } from 'react';
import type { AppointmentDto, AtelierDto } from '@angaly/types';

import { APPOINTMENT_TYPE_LABELS } from '../consts/appointment-type-labels.const';
import { formatAppointmentDate, formatAppointmentTime } from '../utils/formatAppointmentDateTime';
import { AtelierLocationSnippet } from './AtelierLocationSnippet';

interface AppointmentRecapCardProps {
  appointment: AppointmentDto;
  atelier: AtelierDto | null;
}

function RecapRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between border-b border-angaly-border py-3 last:border-b-0">
      <span className="text-xs tracking-widest text-angaly-slate uppercase">{label}</span>
      <span className="text-angaly-navy">{children}</span>
    </div>
  );
}

/**
 * Recap card — the real Stitch screen has no dedicated "Couturière" field until one is
 * assigned (`assignedToId` is only set once staff confirms, see docs/features/appointments.md)
 * — that row only renders once `assignedToId` is present.
 *
 * `message` also renders when present: `reservation-essayage` encodes its product/size
 * context there (no `productId`/`productVariantId` column on `Appointment` — see
 * docs/pages/reservation-essayage.md "Points d'attention") rather than a schema workaround.
 */
export function AppointmentRecapCard({ appointment, atelier }: AppointmentRecapCardProps) {
  return (
    <div className="border border-angaly-border bg-angaly-ivory/30 p-6">
      <RecapRow label="Numéro">{appointment.reference}</RecapRow>
      <RecapRow label="Type">{APPOINTMENT_TYPE_LABELS[appointment.type]}</RecapRow>
      <RecapRow label="Date">{formatAppointmentDate(appointment.scheduledAt)}</RecapRow>
      <RecapRow label="Heure">{formatAppointmentTime(appointment.scheduledAt)}</RecapRow>
      <div className="py-3">
        <span className="mb-2 block text-xs tracking-widest text-angaly-slate uppercase">Atelier &amp; Contact</span>
        <AtelierLocationSnippet atelier={atelier} />
      </div>
      {appointment.assignedToId && <RecapRow label="Couturière">Assignée</RecapRow>}
      {appointment.message && <RecapRow label="Détails">{appointment.message}</RecapRow>}
    </div>
  );
}
