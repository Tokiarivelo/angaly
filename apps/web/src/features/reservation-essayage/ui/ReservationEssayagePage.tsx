'use client';

import { useAteliersQuery } from '../api/appointments.api';
import { useEssayageForm } from '../hooks/useEssayageForm';
import { AtelierSelect } from './AtelierSelect';
import { AvailabilityCalendar } from './AvailabilityCalendar';
import { ContactFieldsGroup } from './ContactFieldsGroup';
import { ProductSummaryRow } from './ProductSummaryRow';
import { ReservationFooterActions } from './ReservationFooterActions';
import { SizeChipSelector } from './SizeChipSelector';
import { TimeSlotChips } from './TimeSlotChips';

/** Root component — verified live via `agy` against "ANGALY — Réserver un essayage". */
export function ReservationEssayagePage() {
  const {
    register,
    handleSubmit,
    errors,
    onSubmit,
    isSubmitting,
    isError,
    size,
    atelierId,
    date,
    scheduledAt,
    selectSize,
    selectAtelier,
    selectDate,
    selectSlot,
    availability,
    productContext,
  } = useEssayageForm();
  const ateliersQuery = useAteliersQuery();

  const availableSizes = productContext.product
    ? Array.from(new Set(productContext.product.variants.map((variant) => variant.size)))
    : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 lg:px-8">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <h1 className="font-heading mb-8 text-3xl text-angaly-navy italic">Réserver un essayage</h1>
          <ProductSummaryRow product={productContext.product} isLoading={productContext.isLoading} />
        </div>

        <div className="lg:col-span-7">
          <form
            onSubmit={(event) => {
              void handleSubmit(onSubmit)(event);
            }}
            className="space-y-10"
          >
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-heading text-lg text-angaly-navy">Sélectionnez votre taille</h2>
                <button type="button" className="text-xs tracking-widest text-angaly-slate uppercase underline underline-offset-4">
                  Guide des tailles
                </button>
              </div>
              <SizeChipSelector sizes={availableSizes} selectedSize={size} onSelect={selectSize} />
              {errors.size && (
                <p role="alert" className="mt-2 text-xs text-angaly-error">
                  {errors.size.message}
                </p>
              )}
            </section>

            <hr className="border-angaly-border" />

            <section>
              <h2 className="font-heading mb-4 text-lg text-angaly-navy">Lieu de l&apos;essayage</h2>
              <AtelierSelect
                ateliers={ateliersQuery.data ?? []}
                value={atelierId}
                onChange={selectAtelier}
                isLoading={ateliersQuery.isLoading}
              />
              {errors.atelierId && (
                <p role="alert" className="mt-2 text-xs text-angaly-error">
                  {errors.atelierId.message}
                </p>
              )}
            </section>

            <hr className="border-angaly-border" />

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              <section>
                <h2 className="font-heading mb-4 text-lg text-angaly-navy">Date</h2>
                <AvailabilityCalendar
                  month={availability.month}
                  days={availability.days}
                  isLoading={availability.isLoadingDays}
                  selectedDate={date || null}
                  onSelectDate={selectDate}
                  onPreviousMonth={availability.goToPreviousMonth}
                  onNextMonth={availability.goToNextMonth}
                />
                {errors.date && (
                  <p role="alert" className="mt-2 text-xs text-angaly-error">
                    {errors.date.message}
                  </p>
                )}
              </section>

              <section>
                <h2 className="font-heading mb-4 text-lg text-angaly-navy">Heure</h2>
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
            </div>

            <hr className="border-angaly-border" />

            <ContactFieldsGroup register={register} errors={errors} />

            <ReservationFooterActions isSubmitting={isSubmitting} isError={isError} />
          </form>
        </div>
      </div>
    </div>
  );
}
