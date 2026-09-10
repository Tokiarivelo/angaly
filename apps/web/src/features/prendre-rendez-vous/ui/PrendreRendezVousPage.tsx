'use client';

import { useAppointmentForm } from '../hooks/useAppointmentForm';
import { useAteliersQuery } from '../api/appointments.api';
import { AppointmentFooterBar } from './AppointmentFooterBar';
import { AppointmentTypeChips } from './AppointmentTypeChips';
import { AtelierSelect } from './AtelierSelect';
import { AvailabilityCalendar } from './AvailabilityCalendar';
import { ContactFieldsGroup } from './ContactFieldsGroup';
import { TimeSlotChips } from './TimeSlotChips';

/** Root component — two-column layout (formulaire + calendrier sticky), verified live via `agy` against "ANGALY — Prendre rendez-vous (Booking)". */
export function PrendreRendezVousPage() {
  const {
    register,
    handleSubmit,
    errors,
    onSubmit,
    isSubmitting,
    isError,
    selectedType,
    atelierId,
    date,
    scheduledAt,
    selectType,
    selectAtelier,
    selectDate,
    selectSlot,
    availability,
  } = useAppointmentForm();
  const ateliersQuery = useAteliersQuery();

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
      <header className="mb-12 text-center">
        <h1 className="font-heading text-4xl text-angaly-navy italic">Prendre rendez-vous</h1>
        <p className="mt-4 text-angaly-slate">Réservez un moment avec Angaly pour donner vie à votre projet.</p>
      </header>

      <form
        onSubmit={(event) => {
          void handleSubmit(onSubmit)(event);
        }}
        className="grid grid-cols-1 gap-12 lg:grid-cols-12"
      >
        <div className="space-y-10 lg:col-span-7">
          <section>
            <h2 className="font-heading mb-4 text-lg text-angaly-navy">1. Type de création</h2>
            <AppointmentTypeChips selectedType={selectedType} onSelect={selectType} />
            {errors.type && (
              <p role="alert" className="mt-2 text-xs text-angaly-error">
                {errors.type.message}
              </p>
            )}
          </section>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <AtelierSelect
              ateliers={ateliersQuery.data ?? []}
              value={atelierId}
              onChange={selectAtelier}
              isLoading={ateliersQuery.isLoading}
            />
            <div>
              <label htmlFor="date" className="mb-2 block text-xs tracking-widest text-angaly-slate uppercase">
                3. Date
              </label>
              <input
                id="date"
                type="date"
                value={date}
                disabled={!atelierId}
                onChange={(event) => selectDate(event.target.value)}
                className="w-full border-0 border-b border-angaly-border bg-transparent py-3 text-angaly-navy focus:border-angaly-gold focus:ring-0 disabled:opacity-50"
              />
              {errors.date && (
                <p role="alert" className="mt-1 text-xs text-angaly-error">
                  {errors.date.message}
                </p>
              )}
            </div>
          </div>

          <section>
            <h2 className="font-heading mb-4 text-lg text-angaly-navy">4. Heure</h2>
            <TimeSlotChips
              slots={availability.slots}
              selectedSlot={scheduledAt}
              isLoading={availability.isLoadingSlots}
              onSelect={selectSlot}
            />
            {errors.scheduledAt && (
              <p role="alert" className="mt-2 text-xs text-angaly-error">
                {errors.scheduledAt.message}
              </p>
            )}
          </section>

          <ContactFieldsGroup register={register} errors={errors} />

          {isError && (
            <p role="alert" className="text-xs text-angaly-error">
              Une erreur est survenue, veuillez réessayer dans quelques instants.
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="hidden w-full bg-angaly-navy py-5 text-sm tracking-widest text-white uppercase transition-colors duration-300 disabled:opacity-60 lg:block"
          >
            {isSubmitting ? 'Envoi…' : 'Confirmer le rendez-vous'}
          </button>
        </div>

        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-24">
            <AvailabilityCalendar
              month={availability.month}
              days={availability.days}
              isLoading={availability.isLoadingDays}
              selectedDate={date || null}
              onSelectDate={selectDate}
              onPreviousMonth={availability.goToPreviousMonth}
              onNextMonth={availability.goToNextMonth}
            />
          </div>
        </div>

        <AppointmentFooterBar isSubmitting={isSubmitting} isError={isError} />
      </form>
    </div>
  );
}
