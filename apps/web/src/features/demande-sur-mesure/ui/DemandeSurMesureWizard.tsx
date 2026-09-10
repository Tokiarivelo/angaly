'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { ROUTES } from '@/lib/routes';

import { useDemandeSurMesureWizard } from '../hooks/useDemandeSurMesureWizard';
import { ConfirmationCard } from './ConfirmationCard';
import { WizardFooterNav } from './WizardFooterNav';
import { WizardProgressBar } from './WizardProgressBar';
import { CoordonneesStep } from './steps/CoordonneesStep';
import { InspirationMessageStep } from './steps/InspirationMessageStep';
import { ProjetStep } from './steps/ProjetStep';

/** Shell: header, progress bar, step switch, footer nav — all state lives in useDemandeSurMesureWizard(). */
export function DemandeSurMesureWizard() {
  const wizard = useDemandeSurMesureWizard();

  /** Step-aware dispatch shared by the primary button's onClick and the form's Enter-key submit — see WizardFooterNav.tsx. */
  const handlePrimaryAction = () => {
    if (wizard.step === 3) {
      void wizard.onSubmit();
    } else {
      void wizard.goNext();
    }
  };

  if (wizard.isSubmitted && wizard.submittedQuote) {
    return (
      <main className="min-h-screen bg-angaly-ivory px-6 py-24">
        <ConfirmationCard quote={wizard.submittedQuote} values={wizard.values} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-angaly-ivory px-6 py-16">
      <div className="mx-auto max-w-xl">
        <Link
          href={ROUTES.surMesure}
          className="mb-8 inline-flex items-center gap-1 text-sm text-angaly-slate hover:text-angaly-navy"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Retour
        </Link>
        <h1 className="font-heading mb-2 text-3xl text-angaly-navy">Demande de création sur mesure</h1>
        <p className="mb-10 text-sm text-angaly-slate">Racontez-nous votre projet, nous vous recontactons rapidement.</p>

        <WizardProgressBar step={wizard.step} />

        <form
          onSubmit={(event) => {
            event.preventDefault();
            handlePrimaryAction();
          }}
        >
          {wizard.step === 1 && (
            <ProjetStep
              values={wizard.values}
              register={wizard.register}
              selectGarmentType={wizard.selectGarmentType}
              selectOccasion={wizard.selectOccasion}
              errors={wizard.errors}
            />
          )}
          {wizard.step === 2 && <CoordonneesStep contact={wizard.contact} customerProfile={wizard.customerProfile} />}
          {wizard.step === 3 && (
            <InspirationMessageStep
              values={wizard.values}
              register={wizard.register}
              selectFabric={wizard.selectFabric}
              upload={wizard.upload}
            />
          )}

          {wizard.isError && (
            <p role="alert" className="text-angaly-error mt-4 text-sm">
              Une erreur est survenue, veuillez réessayer.
            </p>
          )}

          <WizardFooterNav
            showBack={wizard.step > 1}
            onBack={wizard.goBack}
            primaryLabel={wizard.step === 3 ? 'Envoyer ma demande' : 'Continuer'}
            onPrimary={handlePrimaryAction}
            disabled={wizard.step === 3 ? wizard.isSubmitting || wizard.upload.isUploading : false}
          />
        </form>
      </div>
    </main>
  );
}
