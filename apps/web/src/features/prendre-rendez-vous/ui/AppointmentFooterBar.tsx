'use client';

interface AppointmentFooterBarProps {
  isSubmitting: boolean;
  isError: boolean;
}

/** Sticky "Confirmer le rendez-vous" bar — mobile-only per docs/pages/prendre-rendez-vous.md (desktop keeps the inline submit button). */
export function AppointmentFooterBar({ isSubmitting, isError }: AppointmentFooterBarProps) {
  return (
    <div className="sticky bottom-0 z-10 border-t border-angaly-border bg-angaly-ivory/95 p-4 backdrop-blur lg:hidden">
      {isError && (
        <p role="alert" className="mb-2 text-center text-xs text-angaly-error">
          Une erreur est survenue, veuillez réessayer.
        </p>
      )}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-angaly-navy py-4 text-sm tracking-widest text-white uppercase transition-colors duration-300 disabled:opacity-60"
      >
        {isSubmitting ? 'Envoi…' : 'Confirmer le rendez-vous'}
      </button>
    </div>
  );
}
