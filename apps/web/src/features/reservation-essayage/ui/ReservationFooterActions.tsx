'use client';

interface ReservationFooterActionsProps {
  isSubmitting: boolean;
  isError: boolean;
}

/**
 * Submit button + legal note. No "Annuler" link — the real Stitch screen doesn't have one
 * (see docs/pages/reservation-essayage.md "Points d'attention"); a visitor who wants out
 * simply navigates back to the product page.
 */
export function ReservationFooterActions({ isSubmitting, isError }: ReservationFooterActionsProps) {
  return (
    <div className="space-y-3">
      {isError && (
        <p role="alert" className="text-xs text-angaly-error">
          Une erreur est survenue, veuillez réessayer dans quelques instants.
        </p>
      )}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-angaly-navy py-4 text-sm tracking-widest text-white uppercase transition-colors duration-300 disabled:opacity-60"
      >
        {isSubmitting ? 'Envoi…' : 'Confirmer la réservation'}
      </button>
      <p className="text-center text-xs text-angaly-slate">
        En confirmant, vous acceptez nos{' '}
        <a href="/conditions-generales" className="underline underline-offset-4 hover:text-angaly-navy">
          Conditions Générales
        </a>
        .
      </p>
    </div>
  );
}
