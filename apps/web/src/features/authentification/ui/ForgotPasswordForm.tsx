'use client';

import type { UseFormHandleSubmit, UseFormRegister, FieldErrors } from 'react-hook-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/routes';

import type { ForgotPasswordFormValues } from '../schemas/forgot-password.schema';

interface ForgotPasswordFormProps {
  register: UseFormRegister<ForgotPasswordFormValues>;
  handleSubmit: UseFormHandleSubmit<ForgotPasswordFormValues>;
  errors: FieldErrors<ForgotPasswordFormValues>;
  onSubmit: (values: ForgotPasswordFormValues) => void;
  isSubmitting: boolean;
  isError: boolean;
}

/** Écran Mot de passe oublié — champ email seul, bordure inférieure (docs/pages/authentification.md, verified live against Stitch). */
export function ForgotPasswordForm({
  register,
  handleSubmit,
  errors,
  onSubmit,
  isSubmitting,
  isError,
}: ForgotPasswordFormProps) {
  return (
    <div>
      <h1 className="font-heading text-3xl text-angaly-navy italic">Mot de passe oublié ?</h1>
      <p className="mt-2 text-sm text-angaly-slate">
        Saisissez l’adresse e-mail associée à votre compte Atelier. Nous vous enverrons un lien sécurisé pour
        réinitialiser votre mot de passe.
      </p>

      <form
        noValidate
        onSubmit={(event) => {
          void handleSubmit(onSubmit)(event);
        }}
        className="mt-8 space-y-5"
      >
        <div>
          <label htmlFor="email" className="mb-2 block text-xs tracking-widest text-angaly-slate uppercase">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="Entrez votre adresse e-mail"
            className="w-full border-0 border-b border-angaly-border bg-transparent px-0 py-3 text-angaly-navy placeholder-angaly-warm-gray focus:border-angaly-navy focus:ring-0"
            aria-invalid={Boolean(errors.email)}
            {...register('email')}
          />
          {errors.email && (
            <p role="alert" className="mt-1 text-xs text-angaly-error">
              {errors.email.message}
            </p>
          )}
        </div>

        {isError && (
          <p role="alert" className="text-xs text-angaly-error">
            Une erreur est survenue, veuillez réessayer dans quelques instants.
          </p>
        )}

        <Button type="submit" disabled={isSubmitting} className="w-full uppercase tracking-widest">
          {isSubmitting ? 'Envoi…' : 'Envoyer le lien de réinitialisation'}
        </Button>
      </form>

      <Link
        href={ROUTES.connexion}
        className="mt-8 flex items-center justify-center gap-2 text-sm text-angaly-champagne hover:underline"
      >
        <ArrowLeft size={16} />
        Retour à la connexion
      </Link>
    </div>
  );
}
