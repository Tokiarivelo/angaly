'use client';

import { Mail } from 'lucide-react';

import { useNewsletterForm } from '@/components/newsletter/useNewsletterForm';

/**
 * Real screen's "La Lettre Angaly" sidebar widget — its own layout (stacked underlined
 * input, full-width button) distinct from home's `NewsletterForm`, but sharing the same
 * `useNewsletterForm()` validation/mutation logic (see docs/pages/journal-liste.md "Points
 * d'attention": "ne pas dupliquer la logique de validation/mutation").
 */
export function NewsletterSignupCard() {
  const { register, handleSubmit, errors, onSubmit, isSubmitting, isSuccess, isError } = useNewsletterForm();

  if (isSuccess) {
    return (
      <div className="bg-angaly-navy p-8 text-center text-angaly-ivory">
        <Mail className="mx-auto mb-4 h-9 w-9 text-angaly-champagne" strokeWidth={1.5} aria-hidden="true" />
        <p role="status" className="font-heading text-xl">
          Merci ! Votre inscription à la newsletter est confirmée.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-angaly-navy p-8 text-center text-angaly-ivory">
      <Mail className="mx-auto mb-4 h-9 w-9 text-angaly-champagne" strokeWidth={1.5} aria-hidden="true" />
      <h4 className="font-heading mb-4 text-2xl">La Lettre Angaly</h4>
      <p className="mb-8 text-sm text-angaly-warm-ivory">
        Inscrivez-vous pour recevoir nos dernières inspirations, conseils d&apos;experts et invitations exclusives.
      </p>
      <form
        noValidate
        onSubmit={(event) => {
          void handleSubmit(onSubmit)(event);
        }}
        className="space-y-4"
      >
        <label htmlFor="journal-newsletter-email" className="sr-only">
          Adresse e-mail
        </label>
        <input
          id="journal-newsletter-email"
          type="email"
          placeholder="Votre adresse email"
          className="w-full border-0 border-b border-angaly-warm-ivory/50 bg-transparent px-0 py-2 text-angaly-ivory placeholder:text-angaly-warm-ivory/50 focus:border-angaly-champagne focus:ring-0"
          aria-invalid={Boolean(errors.email)}
          {...register('email')}
        />
        {errors.email && (
          <p role="alert" className="text-left text-xs text-angaly-champagne">
            {errors.email.message}
          </p>
        )}

        <label className="flex items-start gap-2 text-left text-xs text-angaly-warm-ivory/70">
          <input type="checkbox" className="mt-0.5" {...register('consent')} />
          <span>J&apos;accepte de recevoir les actualités et nouvelles collections d&apos;Angaly.</span>
        </label>
        {errors.consent && (
          <p role="alert" className="text-left text-xs text-angaly-champagne">
            {errors.consent.message}
          </p>
        )}

        {isError && (
          <p role="alert" className="text-xs text-angaly-champagne">
            Une erreur est survenue, veuillez réessayer dans quelques instants.
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-4 w-full bg-angaly-ivory py-3 text-sm font-bold tracking-widest text-angaly-navy uppercase transition-colors hover:bg-angaly-champagne disabled:opacity-60"
        >
          {isSubmitting ? 'Envoi…' : "S'inscrire"}
        </button>
      </form>
    </div>
  );
}
