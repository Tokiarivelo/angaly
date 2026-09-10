'use client';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/routes';

import { useSignupForm } from '../hooks/useSignupForm';
import { AuthFormFooterLink } from './AuthFormFooterLink';

const FIELD_CLASS =
  'w-full border-0 border-b border-angaly-border bg-transparent px-0 py-3 text-angaly-navy placeholder-angaly-warm-gray focus:border-angaly-navy focus:ring-0';
const LABEL_CLASS = 'mb-2 block text-xs tracking-widest text-angaly-slate uppercase';

/** Écran Inscription — champs "Atelier" bordure inférieure unique (docs/pages/authentification.md, verified live against Stitch). */
export function SignupForm() {
  const { register, handleSubmit, errors, onSubmit, isSubmitting, isError, errorMessage } = useSignupForm();

  return (
    <div>
      <h1 className="font-heading text-3xl text-angaly-navy italic">Rejoignez l’univers Angaly</h1>
      <p className="mt-2 text-sm text-angaly-slate">Créez votre compte pour une expérience sur mesure.</p>

      <form
        noValidate
        onSubmit={(event) => {
          void handleSubmit(onSubmit)(event);
        }}
        className="mt-8 space-y-5"
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="firstName" className={LABEL_CLASS}>
              Prénom
            </label>
            <input
              id="firstName"
              type="text"
              placeholder="Jean"
              className={FIELD_CLASS}
              aria-invalid={Boolean(errors.firstName)}
              {...register('firstName')}
            />
            {errors.firstName && (
              <p role="alert" className="mt-1 text-xs text-angaly-error">
                {errors.firstName.message}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="lastName" className={LABEL_CLASS}>
              Nom
            </label>
            <input
              id="lastName"
              type="text"
              placeholder="Dupont"
              className={FIELD_CLASS}
              aria-invalid={Boolean(errors.lastName)}
              {...register('lastName')}
            />
            {errors.lastName && (
              <p role="alert" className="mt-1 text-xs text-angaly-error">
                {errors.lastName.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="email" className={LABEL_CLASS}>
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="jean.dupont@example.com"
            className={FIELD_CLASS}
            aria-invalid={Boolean(errors.email)}
            {...register('email')}
          />
          {errors.email && (
            <p role="alert" className="mt-1 text-xs text-angaly-error">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className={LABEL_CLASS}>
            Téléphone
          </label>
          <input
            id="phone"
            type="tel"
            placeholder="+33 6 12 34 56 78"
            className={FIELD_CLASS}
            aria-invalid={Boolean(errors.phone)}
            {...register('phone')}
          />
          {errors.phone && (
            <p role="alert" className="mt-1 text-xs text-angaly-error">
              {errors.phone.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" className={LABEL_CLASS}>
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            className={FIELD_CLASS}
            aria-invalid={Boolean(errors.password)}
            {...register('password')}
          />
          {errors.password && (
            <p role="alert" className="mt-1 text-xs text-angaly-error">
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className={LABEL_CLASS}>
            Confirmer le mot de passe
          </label>
          <input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            className={FIELD_CLASS}
            aria-invalid={Boolean(errors.confirmPassword)}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p role="alert" className="mt-1 text-xs text-angaly-error">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <div className="flex items-start gap-3">
          <input
            id="acceptTerms"
            type="checkbox"
            className="mt-1 h-4 w-4 shrink-0 rounded-none border-angaly-border text-angaly-navy focus:ring-angaly-navy"
            aria-invalid={Boolean(errors.acceptTerms)}
            {...register('acceptTerms')}
          />
          {/*
            Renders as plain text, not a link: no CGU/politique de confidentialité
            page exists yet anywhere in docs/pages (unlike routes.ts's precedent of
            linking to unbuilt-but-planned pages) — see "Points d'attention" in
            docs/pages/authentification.md.
          */}
          <label htmlFor="acceptTerms" className="text-sm text-angaly-slate">
            J’accepte les conditions générales et la politique de confidentialité.
          </label>
        </div>
        {errors.acceptTerms && (
          <p role="alert" className="text-xs text-angaly-error">
            {errors.acceptTerms.message}
          </p>
        )}

        {isError && (
          <p role="alert" className="text-xs text-angaly-error">
            {errorMessage ?? 'Une erreur est survenue.'}
          </p>
        )}

        <Button type="submit" disabled={isSubmitting} className="w-full uppercase tracking-widest">
          {isSubmitting ? 'Création…' : 'Créer mon compte'}
        </Button>
      </form>

      <AuthFormFooterLink prompt="Déjà un compte ?" linkLabel="Se connecter" href={ROUTES.connexion} />
    </div>
  );
}
