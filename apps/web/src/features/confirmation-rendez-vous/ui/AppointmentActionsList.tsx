'use client';

import { CalendarPlus, Pencil, XCircle } from 'lucide-react';
import Link from 'next/link';

import { ROUTES } from '@/lib/routes';

import type { UseCancelAppointmentResult } from '../hooks/useCancelAppointment';

interface AppointmentActionsListProps {
  onAddToCalendar: () => void;
  cancelAppointment: UseCancelAppointmentResult;
  isCancelled: boolean;
}

/**
 * "Ajouter au calendrier" / "Modifier" / "Annuler" — verified on the real Stitch screen.
 * "Modifier" links back to `prendre-rendez-vous` without prefill (see docs/pages/
 * confirmation-rendez-vous.md "Points d'attention" — prefill from `reference` is a TODO,
 * `prendre-rendez-vous` doesn't accept one yet).
 */
export function AppointmentActionsList({ onAddToCalendar, cancelAppointment, isCancelled }: AppointmentActionsListProps) {
  if (isCancelled) {
    return <p className="text-sm text-angaly-slate">Ce rendez-vous a été annulé.</p>;
  }

  if (cancelAppointment.isConfirming) {
    return (
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <span className="text-angaly-navy">Confirmer l&apos;annulation de ce rendez-vous ?</span>
        <button
          type="button"
          onClick={cancelAppointment.confirmCancel}
          disabled={cancelAppointment.isCancelling}
          className="text-angaly-error underline underline-offset-4 disabled:opacity-60"
        >
          {cancelAppointment.isCancelling ? 'Annulation…' : 'Oui, annuler'}
        </button>
        <button type="button" onClick={cancelAppointment.dismissCancel} className="text-angaly-slate underline underline-offset-4">
          Non, garder mon rendez-vous
        </button>
        {cancelAppointment.isError && <p role="alert" className="w-full text-xs text-angaly-error">Une erreur est survenue.</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-6 text-sm">
      <button type="button" onClick={onAddToCalendar} className="flex items-center gap-2 text-angaly-navy hover:text-angaly-gold">
        <CalendarPlus className="h-4 w-4" aria-hidden="true" />
        Ajouter au calendrier
      </button>
      <Link href={ROUTES.prendreRendezVous} className="flex items-center gap-2 text-angaly-navy hover:text-angaly-gold">
        <Pencil className="h-4 w-4" aria-hidden="true" />
        Modifier
      </Link>
      <button
        type="button"
        onClick={cancelAppointment.requestCancel}
        className="flex items-center gap-2 text-angaly-slate hover:text-angaly-error"
      >
        <XCircle className="h-4 w-4" aria-hidden="true" />
        Annuler
      </button>
    </div>
  );
}
