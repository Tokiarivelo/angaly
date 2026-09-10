'use client';

import type { FieldErrors, UseFormRegister } from 'react-hook-form';

import type { EssayageReservationValues } from '../schemas/essayage-reservation.schema';

interface ContactFieldsGroupProps {
  register: UseFormRegister<EssayageReservationValues>;
  errors: FieldErrors<EssayageReservationValues>;
}

/**
 * "Vos coordonnées" — not on the real Stitch screen (see docs/pages/reservation-essayage.md
 * "Points d'attention": the mockup omits contact fields, but `POST /api/appointments`
 * unconditionally requires firstName/lastName/phone/email, and this page must work for an
 * anonymous visitor per its own spec). Same fields as `prendre-rendez-vous`'s own copy.
 */
export function ContactFieldsGroup({ register, errors }: ContactFieldsGroupProps) {
  return (
    <div className="space-y-6">
      <h2 className="font-heading text-lg text-angaly-navy">Vos coordonnées</h2>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="sr-only">
            Prénom
          </label>
          <input
            id="firstName"
            type="text"
            placeholder="Prénom"
            aria-invalid={Boolean(errors.firstName)}
            className="w-full border-0 border-b border-angaly-border bg-transparent px-0 py-3 text-angaly-navy placeholder-angaly-warm-gray focus:border-angaly-gold focus:ring-0"
            {...register('firstName')}
          />
          {errors.firstName && (
            <p role="alert" className="mt-1 text-xs text-angaly-error">
              {errors.firstName.message}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="lastName" className="sr-only">
            Nom
          </label>
          <input
            id="lastName"
            type="text"
            placeholder="Nom"
            aria-invalid={Boolean(errors.lastName)}
            className="w-full border-0 border-b border-angaly-border bg-transparent px-0 py-3 text-angaly-navy placeholder-angaly-warm-gray focus:border-angaly-gold focus:ring-0"
            {...register('lastName')}
          />
          {errors.lastName && (
            <p role="alert" className="mt-1 text-xs text-angaly-error">
              {errors.lastName.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className="sr-only">
            Téléphone
          </label>
          <input
            id="phone"
            type="tel"
            placeholder="Téléphone"
            aria-invalid={Boolean(errors.phone)}
            className="w-full border-0 border-b border-angaly-border bg-transparent px-0 py-3 text-angaly-navy placeholder-angaly-warm-gray focus:border-angaly-gold focus:ring-0"
            {...register('phone')}
          />
          {errors.phone && (
            <p role="alert" className="mt-1 text-xs text-angaly-error">
              {errors.phone.message}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="email" className="sr-only">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="Email"
            aria-invalid={Boolean(errors.email)}
            className="w-full border-0 border-b border-angaly-border bg-transparent px-0 py-3 text-angaly-navy placeholder-angaly-warm-gray focus:border-angaly-gold focus:ring-0"
            {...register('email')}
          />
          {errors.email && (
            <p role="alert" className="mt-1 text-xs text-angaly-error">
              {errors.email.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
