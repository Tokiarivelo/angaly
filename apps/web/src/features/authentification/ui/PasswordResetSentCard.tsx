import { MailCheck } from 'lucide-react';
import Link from 'next/link';

import { ROUTES } from '@/lib/routes';

/**
 * "Email envoyé" confirmation state. No dedicated screen exists for it in the
 * live Stitch project (verified this session via get_screen on the Mot de
 * passe oublié screen and a full project scan — see docs/pages/authentification.md
 * "Points d'attention") — copy comes from stitch-prompts/29-connexion-inscription.md's
 * CONFIRMATION STATE block, the only decided source for this state.
 */
export function PasswordResetSentCard() {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-angaly-champagne/30 bg-angaly-champagne/10">
        <MailCheck className="text-angaly-champagne" size={24} />
      </div>
      <h1 className="mt-6 font-heading text-3xl text-angaly-navy italic">Email envoyé</h1>
      <p className="mt-2 text-sm text-angaly-slate">
        Vérifiez votre boîte de réception pour réinitialiser votre mot de passe.
      </p>
      <Link
        href={ROUTES.connexion}
        className="mt-8 inline-block text-sm text-angaly-champagne hover:underline"
      >
        Retour à la connexion
      </Link>
    </div>
  );
}
