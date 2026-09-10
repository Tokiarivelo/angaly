'use client';

import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/routes';

import { useLoginForm } from '../hooks/useLoginForm';
import { AuthFormFooterLink } from './AuthFormFooterLink';

/** Real 4-color Google "G" mark, from the verified Stitch markup. */
function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

/** Écran Connexion — full-border fields + navy focus (docs/pages/authentification.md, verified live against Stitch). */
export function LoginForm() {
  const { register, handleSubmit, errors, onSubmit, isSubmitting, isError, errorMessage } = useLoginForm();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      <h1 className="font-heading text-3xl text-angaly-navy italic">Bon retour parmi nous</h1>
      <p className="mt-2 text-sm text-angaly-slate">Connectez-vous à votre espace Angaly.</p>

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
            placeholder="votre@email.com"
            className="w-full border border-angaly-border bg-transparent px-4 py-3 text-angaly-navy placeholder-angaly-warm-gray focus:border-angaly-navy focus:ring-1 focus:ring-angaly-navy"
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
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="password" className="text-xs tracking-widest text-angaly-slate uppercase">
              Mot de passe
            </label>
            <Link href={ROUTES.motDePasseOublie} className="text-xs text-angaly-slate hover:text-angaly-navy">
              Mot de passe oublié ?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className="w-full border border-angaly-border bg-transparent px-4 py-3 pr-10 text-angaly-navy placeholder-angaly-warm-gray focus:border-angaly-navy focus:ring-1 focus:ring-angaly-navy"
              aria-invalid={Boolean(errors.password)}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute inset-y-0 right-3 flex items-center text-angaly-slate"
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <p role="alert" className="mt-1 text-xs text-angaly-error">
              {errors.password.message}
            </p>
          )}
        </div>

        {isError && (
          <p role="alert" className="text-xs text-angaly-error">
            {errorMessage ?? 'Identifiants invalides.'}
          </p>
        )}

        <Button type="submit" disabled={isSubmitting} className="group w-full">
          <span>{isSubmitting ? 'Connexion…' : 'Se connecter'}</span>
          <ArrowRight
            size={16}
            className="-translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
          />
        </Button>

        <div className="flex items-center gap-4">
          <span className="h-px flex-1 bg-angaly-border" />
          <span className="text-xs text-angaly-slate">ou</span>
          <span className="h-px flex-1 bg-angaly-border" />
        </div>

        {/* OAuth désactivé tant qu'aucun fournisseur n'est configuré côté module auth — voir docs/pages/authentification.md "Points d'attention". */}
        <Button type="button" variant="secondary" disabled aria-disabled="true" className="w-full">
          <GoogleIcon />
          Continuer avec Google
        </Button>
      </form>

      <AuthFormFooterLink prompt="Pas encore de compte ?" linkLabel="Créer un compte" href={ROUTES.inscription} />
    </div>
  );
}
