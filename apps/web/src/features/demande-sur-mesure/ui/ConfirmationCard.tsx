import type { QuoteDto } from '@angaly/types';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/routes';

import type { DemandeSurMesureFormValues } from '../schemas/wizard-step.schema';

/** Écran terminal après soumission réussie — pas de route dédiée, rendu à la place du wizard. */
export function ConfirmationCard({ quote, values }: { quote: QuoteDto; values: DemandeSurMesureFormValues }) {
  return (
    <div className="mx-auto max-w-xl text-center">
      <div className="bg-angaly-champagne/20 mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full">
        <CheckCircle2 className="text-angaly-gold h-8 w-8" strokeWidth={1.5} aria-hidden="true" />
      </div>
      <h1 className="font-heading mb-4 text-3xl text-angaly-navy">Votre demande a bien été envoyée</h1>
      <p className="mb-10 text-sm text-angaly-slate">
        Notre équipe vous recontactera sous 48h pour organiser une consultation.
      </p>
      <div className="border-angaly-border mb-10 border-t border-b text-left">
        <h2 className="font-heading mt-6 mb-4 text-lg text-angaly-navy">Résumé de votre demande</h2>
        <dl className="mb-6 space-y-3">
          <div className="flex justify-between text-sm">
            <dt className="text-angaly-slate">Type de création</dt>
            <dd className="text-angaly-navy">{values.garmentType}</dd>
          </div>
          {values.occasion && (
            <div className="flex justify-between text-sm">
              <dt className="text-angaly-slate">Occasion</dt>
              <dd className="text-angaly-navy">{values.occasion}</dd>
            </div>
          )}
          {values.eventDate && (
            <div className="flex justify-between text-sm">
              <dt className="text-angaly-slate">Date souhaitée</dt>
              <dd className="text-angaly-navy">{values.eventDate}</dd>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <dt className="text-angaly-slate">Référence de dossier</dt>
            <dd className="font-mono text-angaly-navy">{quote.quoteNumber}</dd>
          </div>
        </dl>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
        <Button asChild size="lg">
          <Link href={ROUTES.prendreRendezVous}>Prendre rendez-vous dès maintenant</Link>
        </Button>
        <Button asChild variant="secondary" size="lg">
          <Link href={ROUTES.home}>Retour à l&apos;accueil</Link>
        </Button>
      </div>
    </div>
  );
}
