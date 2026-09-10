'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { useCustomerProfileQuery } from '../api/quote-requests.api';
import { demandeSurMesureSchema, STEP_1_FIELDS, type DemandeSurMesureFormValues } from '../schemas/wizard-step.schema';
import type { WizardStep } from '../types/wizard-state.types';
import { useInspirationUpload } from './useInspirationUpload';
import { useSubmitQuoteRequest } from './useSubmitQuoteRequest';

/**
 * All wizard state (current step, form values, validation, upload, submission)
 * lives here — `DemandeSurMesureWizard.tsx` and each `steps/*Step.tsx` only
 * read this hook's output (JSX + hooks only, per CLAUDE.md règle #8).
 *
 * `garmentType` is the only field with real validation (matches
 * `SurMesureRequestDto` — every other field is optional server-side, so
 * step 1's "Continuer" is the only gated transition).
 */
export function useDemandeSurMesureWizard() {
  const [step, setStep] = useState<WizardStep>(1);

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DemandeSurMesureFormValues>({
    resolver: zodResolver(demandeSurMesureSchema),
    defaultValues: {
      garmentType: '',
      occasion: '',
      eventDate: '',
      budgetRange: '',
      details: '',
      fabricPreference: '',
      message: '',
    },
  });

  const values = watch();
  const { data: session } = useSession();
  const customerProfile = useCustomerProfileQuery();
  const upload = useInspirationUpload();

  /**
   * Read-only display for step 2 — `SurMesureRequestDto` has no firstName/
   * lastName/phone/email fields (contact is resolved server-side from the
   * authenticated Customer, see docs/features/quotes.md "Décidé"), so this
   * is a confirmation of the account's existing info, not an editable form
   * whose edits would silently be discarded.
   */
  const contact = {
    firstName: customerProfile.data?.firstName ?? null,
    lastName: customerProfile.data?.lastName ?? null,
    phone: customerProfile.data?.phone ?? null,
    email: session?.user.email ?? null,
  };
  const { submit, quote, isSubmitting, isError } = useSubmitQuoteRequest();

  async function goNext() {
    if (step === 1) {
      const isValid = await trigger(STEP_1_FIELDS);
      if (!isValid) return;
    }
    setStep((current) => (current < 3 ? ((current + 1) as WizardStep) : current));
  }

  function goBack() {
    setStep((current) => (current > 1 ? ((current - 1) as WizardStep) : current));
  }

  const selectGarmentType = (value: string) => setValue('garmentType', value, { shouldValidate: true });
  const selectOccasion = (value: string) => setValue('occasion', value, { shouldValidate: true });
  const selectFabric = (value: string) => setValue('fabricPreference', value, { shouldValidate: true });

  const onSubmit = handleSubmit(async (formValues) => {
    await submit(formValues, upload.mediaIds);
  });

  return {
    step,
    goNext,
    goBack,
    register,
    errors,
    values,
    selectGarmentType,
    selectOccasion,
    selectFabric,
    customerProfile,
    contact,
    upload,
    onSubmit,
    isSubmitting,
    isError,
    isSubmitted: quote !== undefined,
    submittedQuote: quote,
  };
}

export type UseDemandeSurMesureWizardResult = ReturnType<typeof useDemandeSurMesureWizard>;
