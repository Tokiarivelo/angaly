import type { UseDemandeSurMesureWizardResult } from '../../hooks/useDemandeSurMesureWizard';

type CoordonneesStepProps = Pick<UseDemandeSurMesureWizardResult, 'contact' | 'customerProfile'>;

/**
 * Read-only confirmation of the signed-in account's contact info (not an
 * editable form — see the note in useDemandeSurMesureWizard.ts). A visitor
 * without a session never reaches this page: `(client)/layout.tsx` redirects
 * to `/connexion` first (docs/features/quotes.md "Décidé").
 */
export function CoordonneesStep({ contact, customerProfile }: CoordonneesStepProps) {
  if (customerProfile.isLoading) {
    return <p className="text-sm text-angaly-slate">Chargement de votre profil…</p>;
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-angaly-slate">
        Afin que notre atelier puisse vous contacter pour discuter de votre demande de création sur mesure.
      </p>
      <dl className="border-angaly-border divide-angaly-border divide-y border-t border-b">
        <div className="flex justify-between py-3">
          <dt className="text-sm text-angaly-slate">Prénom</dt>
          <dd className="text-sm text-angaly-navy">{contact.firstName ?? 'Non renseigné'}</dd>
        </div>
        <div className="flex justify-between py-3">
          <dt className="text-sm text-angaly-slate">Nom</dt>
          <dd className="text-sm text-angaly-navy">{contact.lastName ?? 'Non renseigné'}</dd>
        </div>
        <div className="flex justify-between py-3">
          <dt className="text-sm text-angaly-slate">Téléphone</dt>
          <dd className="text-sm text-angaly-navy">{contact.phone ?? 'Non renseigné'}</dd>
        </div>
        <div className="flex justify-between py-3">
          <dt className="text-sm text-angaly-slate">Email</dt>
          <dd className="text-sm text-angaly-navy">{contact.email ?? 'Non renseigné'}</dd>
        </div>
      </dl>
    </div>
  );
}
