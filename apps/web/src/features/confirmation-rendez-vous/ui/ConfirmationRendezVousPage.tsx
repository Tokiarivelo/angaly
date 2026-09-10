'use client';

import Link from 'next/link';
import { AppointmentStatus } from '@angaly/types';

import { Footer } from '@/components/layout/Footer';
import { ROUTES } from '@/lib/routes';

import { useAddToCalendar } from '../hooks/useAddToCalendar';
import { useAppointment } from '../hooks/useAppointment';
import { useCancelAppointment } from '../hooks/useCancelAppointment';
import { AppointmentActionsList } from './AppointmentActionsList';
import { AppointmentRecapCard } from './AppointmentRecapCard';
import { DiscoverMoreSidePanel } from './DiscoverMoreSidePanel';
import { SuccessBadge } from './SuccessBadge';

interface ConfirmationRendezVousPageProps {
  reference: string;
}

/**
 * Root component — verified live via `agy` against "ANGALY — Confirmation de rendez-vous".
 * Minimal header (logo only, no nav) matches the real screen and the page doc's "Header
 * minimal" requirement — reuses the site's real `Footer` instead of the screen's English
 * placeholder footer copy (see docs/pages/confirmation-rendez-vous.md "Points d'attention").
 */
export function ConfirmationRendezVousPage({ reference }: ConfirmationRendezVousPageProps) {
  const { appointment, atelier, isLoading, isError } = useAppointment(reference);
  const { downloadIcs } = useAddToCalendar(appointment, atelier);
  const cancelAppointment = useCancelAppointment(reference);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="py-8 text-center">
        <Link href={ROUTES.home} className="font-heading text-2xl tracking-wide text-angaly-navy">
          ANGALY
        </Link>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24">
        {isLoading && (
          <p role="status" className="text-center text-angaly-slate">
            Chargement de votre rendez-vous…
          </p>
        )}

        {isError && (
          <p role="alert" className="text-center text-angaly-error">
            Ce rendez-vous est introuvable — vérifiez le lien reçu par email ou WhatsApp.
          </p>
        )}

        {appointment && (
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            <div className="space-y-8 lg:col-span-7">
              <div className="text-center">
                <SuccessBadge />
                <h1 className="font-heading mt-6 text-3xl text-angaly-navy italic">Votre rendez-vous est confirmé</h1>
                <p className="mt-2 text-angaly-slate">Nous avons hâte de vous accueillir.</p>
              </div>

              <AppointmentRecapCard appointment={appointment} atelier={atelier} />

              <AppointmentActionsList
                onAddToCalendar={downloadIcs}
                cancelAppointment={cancelAppointment}
                isCancelled={appointment.status === AppointmentStatus.CANCELLED}
              />

              <div className="flex flex-col items-center gap-4 pt-4 sm:flex-row sm:justify-center">
                <Link
                  href={ROUTES.home}
                  className="bg-angaly-navy px-8 py-4 text-sm tracking-widest text-white uppercase transition-colors duration-300 hover:bg-angaly-navy/90"
                >
                  Retour à l&apos;accueil
                </Link>
                <Link href="/mes-rendez-vous" className="text-sm tracking-widest text-angaly-navy underline underline-offset-4 uppercase">
                  Voir mes rendez-vous
                </Link>
              </div>

              <p className="text-center text-xs text-angaly-slate">
                Une confirmation a été envoyée par email et WhatsApp.
              </p>
            </div>

            <div className="lg:col-span-5">
              <DiscoverMoreSidePanel />
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
