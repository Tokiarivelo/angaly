import { BUDGET_RANGES } from '../../consts/budget-ranges.const';
import { EVENTS } from '../../consts/events.const';
import { GARMENT_TYPES } from '../../consts/garment-types.const';
import type { UseDemandeSurMesureWizardResult } from '../../hooks/useDemandeSurMesureWizard';
import { ChipOption } from '../ChipOption';

type ProjetStepProps = Pick<
  UseDemandeSurMesureWizardResult,
  'values' | 'register' | 'selectGarmentType' | 'selectOccasion' | 'errors'
>;

/** Step 1 — Votre projet: type de vêtement, événement, date, budget, détails optionnels. */
export function ProjetStep({ values, register, selectGarmentType, selectOccasion, errors }: ProjetStepProps) {
  return (
    <div className="space-y-8">
      <fieldset>
        <legend className="mb-3 text-sm font-medium text-angaly-navy">Type de vêtement</legend>
        <div className="flex flex-wrap gap-2">
          {GARMENT_TYPES.map((type) => (
            <ChipOption
              key={type}
              label={type}
              selected={values.garmentType === type}
              onSelect={() => selectGarmentType(type)}
            />
          ))}
        </div>
        {errors.garmentType && (
          <p role="alert" className="text-angaly-error mt-2 text-xs">
            {errors.garmentType.message}
          </p>
        )}
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-sm font-medium text-angaly-navy">Événement</legend>
        <div className="flex flex-wrap gap-2">
          {EVENTS.map((event) => (
            <ChipOption key={event} label={event} selected={values.occasion === event} onSelect={() => selectOccasion(event)} />
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="eventDate" className="mb-2 block text-sm font-medium text-angaly-navy">
          Date de l&apos;événement
        </label>
        <input
          id="eventDate"
          type="date"
          {...register('eventDate')}
          className="border-angaly-border focus:border-angaly-navy w-full border-b bg-transparent py-2 text-angaly-navy focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="budgetRange" className="mb-2 block text-sm font-medium text-angaly-navy">
          Budget indicatif
        </label>
        <select
          id="budgetRange"
          {...register('budgetRange')}
          className="border-angaly-border focus:border-angaly-navy w-full border-b bg-transparent py-2 text-angaly-navy focus:outline-none"
        >
          <option value="">Sélectionner une fourchette</option>
          {BUDGET_RANGES.map((range) => (
            <option key={range} value={range}>
              {range}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="details" className="mb-2 block text-sm font-medium text-angaly-navy">
          Détails du projet (Optionnel)
        </label>
        <textarea
          id="details"
          rows={3}
          {...register('details')}
          placeholder="Inspirations, matières souhaitées, contraintes particulières..."
          className="border-angaly-border focus:border-angaly-navy w-full border bg-white p-3 text-sm text-angaly-navy focus:outline-none"
        />
      </div>
    </div>
  );
}
