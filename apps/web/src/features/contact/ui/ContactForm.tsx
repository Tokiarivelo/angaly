'use client';

import { CONTACT_SUBJECTS } from '../consts/contact-subjects.const';
import { useContactForm } from '../hooks/useContactForm';

/** Real screen's "Écrivez-nous" form card — bordered, gold corner accents, no page reload. */
export function ContactForm() {
  const { register, handleSubmit, errors, onSubmit, isSubmitting, isSuccess, isError } = useContactForm();

  if (isSuccess) {
    return (
      <div className="relative border border-angaly-border bg-angaly-ivory p-8 text-center md:p-12">
        <p role="status" className="font-heading text-2xl text-angaly-navy italic">
          Merci, votre message a bien été envoyé.
        </p>
        <p className="mt-4 text-sm text-angaly-slate">Notre équipe vous répondra dans les plus brefs délais.</p>
      </div>
    );
  }

  return (
    <div className="relative border border-angaly-border bg-angaly-ivory p-8 md:p-12">
      <h2 className="font-heading mb-8 text-center text-3xl tracking-wide text-angaly-navy italic">Écrivez-nous</h2>
      <form
        noValidate
        onSubmit={(event) => {
          void handleSubmit(onSubmit)(event);
        }}
        className="space-y-6"
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="prenom" className="mb-2 block text-xs tracking-widest text-angaly-slate uppercase">
              Prénom
            </label>
            <input
              id="prenom"
              type="text"
              placeholder="Votre prénom"
              className="w-full border-0 border-b border-angaly-border bg-transparent px-0 py-3 text-angaly-navy placeholder-angaly-warm-gray focus:border-angaly-gold focus:ring-0"
              aria-invalid={Boolean(errors.prenom)}
              {...register('prenom')}
            />
            {errors.prenom && <p role="alert" className="mt-1 text-xs text-angaly-error">{errors.prenom.message}</p>}
          </div>
          <div>
            <label htmlFor="nom" className="mb-2 block text-xs tracking-widest text-angaly-slate uppercase">
              Nom
            </label>
            <input
              id="nom"
              type="text"
              placeholder="Votre nom"
              className="w-full border-0 border-b border-angaly-border bg-transparent px-0 py-3 text-angaly-navy placeholder-angaly-warm-gray focus:border-angaly-gold focus:ring-0"
              aria-invalid={Boolean(errors.nom)}
              {...register('nom')}
            />
            {errors.nom && <p role="alert" className="mt-1 text-xs text-angaly-error">{errors.nom.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="email" className="mb-2 block text-xs tracking-widest text-angaly-slate uppercase">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="adresse@email.com"
              className="w-full border-0 border-b border-angaly-border bg-transparent px-0 py-3 text-angaly-navy placeholder-angaly-warm-gray focus:border-angaly-gold focus:ring-0"
              aria-invalid={Boolean(errors.email)}
              {...register('email')}
            />
            {errors.email && <p role="alert" className="mt-1 text-xs text-angaly-error">{errors.email.message}</p>}
          </div>
          <div>
            <label htmlFor="telephone" className="mb-2 block text-xs tracking-widest text-angaly-slate uppercase">
              Téléphone
            </label>
            <input
              id="telephone"
              type="tel"
              placeholder="+261..."
              className="w-full border-0 border-b border-angaly-border bg-transparent px-0 py-3 text-angaly-navy placeholder-angaly-warm-gray focus:border-angaly-gold focus:ring-0"
              {...register('telephone')}
            />
          </div>
        </div>

        <div>
          <label htmlFor="sujet" className="mb-2 block text-xs tracking-widest text-angaly-slate uppercase">
            Sujet
          </label>
          <select
            id="sujet"
            defaultValue=""
            className="w-full appearance-none border-0 border-b border-angaly-border bg-transparent px-0 py-3 text-angaly-navy focus:border-angaly-gold focus:ring-0"
            aria-invalid={Boolean(errors.sujet)}
            {...register('sujet')}
          >
            <option value="" disabled className="text-angaly-warm-gray">
              Sélectionnez un sujet
            </option>
            {CONTACT_SUBJECTS.map((subject) => (
              <option key={subject.value} value={subject.value}>
                {subject.label}
              </option>
            ))}
          </select>
          {errors.sujet && <p role="alert" className="mt-1 text-xs text-angaly-error">{errors.sujet.message}</p>}
        </div>

        <div>
          <label htmlFor="message" className="mb-2 block text-xs tracking-widest text-angaly-slate uppercase">
            Message
          </label>
          <textarea
            id="message"
            rows={5}
            placeholder="Détaillez votre demande ici..."
            className="w-full resize-none border border-angaly-border bg-transparent p-4 text-angaly-navy placeholder-angaly-warm-gray focus:border-angaly-gold focus:ring-0"
            aria-invalid={Boolean(errors.message)}
            {...register('message')}
          />
          {errors.message && <p role="alert" className="mt-1 text-xs text-angaly-error">{errors.message.message}</p>}
        </div>

        {isError && (
          <p role="alert" className="text-xs text-angaly-error">
            Une erreur est survenue, veuillez réessayer dans quelques instants.
          </p>
        )}

        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="hover:bg-angaly-navy-blue w-full bg-angaly-navy py-5 text-sm tracking-widest text-white uppercase transition-colors duration-300 disabled:opacity-60"
          >
            {isSubmitting ? 'Envoi…' : 'Envoyer le message'}
          </button>
        </div>
      </form>
    </div>
  );
}
