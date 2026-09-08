'use client';

import { useNewsletterForm } from '@/components/newsletter/useNewsletterForm';
import { Button } from '@/components/ui/button';

export function NewsletterForm() {
  const { register, handleSubmit, errors, onSubmit, isSubmitting, isSuccess, isError } = useNewsletterForm();

  if (isSuccess) {
    return (
      <p role="status" className="text-center text-white">
        Merci ! Votre inscription à la newsletter est confirmée.
      </p>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        void handleSubmit(onSubmit)(event);
      }}
      noValidate
      className="mx-auto max-w-md"
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="newsletter-email" className="sr-only">
          Adresse e-mail
        </label>
        <input
          id="newsletter-email"
          type="email"
          placeholder="Votre adresse e-mail"
          className="h-11 flex-1 rounded-sm border-0 bg-white px-4 text-sm text-angaly-navy placeholder:text-angaly-warm-gray focus:outline-none focus-visible:ring-2 focus-visible:ring-angaly-champagne"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'newsletter-email-error' : undefined}
          {...register('email')}
        />
        <Button type="submit" size="default" className="bg-white text-angaly-navy hover:bg-white/90" disabled={isSubmitting}>
          {isSubmitting ? 'Envoi…' : "S'inscrire"}
        </Button>
      </div>
      {errors.email && (
        <p id="newsletter-email-error" role="alert" className="mt-2 text-xs text-angaly-champagne">
          {errors.email.message}
        </p>
      )}

      <label className="mt-4 flex items-start gap-2 text-xs text-white/60">
        <input type="checkbox" className="mt-0.5" {...register('consent')} />
        <span>J&apos;accepte de recevoir les actualités et nouvelles collections d&apos;Angaly.</span>
      </label>
      {errors.consent && (
        <p role="alert" className="mt-1 text-xs text-angaly-champagne">
          {errors.consent.message}
        </p>
      )}

      {isError && (
        <p role="alert" className="mt-3 text-xs text-angaly-champagne">
          Une erreur est survenue, veuillez réessayer dans quelques instants.
        </p>
      )}
    </form>
  );
}
