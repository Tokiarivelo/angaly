'use client';

import { useSubmitQuoteRequestMutation } from '../api/quote-requests.api';
import type { DemandeSurMesureFormValues } from '../schemas/wizard-step.schema';

/** Maps the wizard's flat form values + uploaded photo ids to `POST /api/quotes/requests`. */
export function useSubmitQuoteRequest() {
  const mutation = useSubmitQuoteRequestMutation();

  function submit(values: DemandeSurMesureFormValues, inspirationMediaIds: string[]) {
    return mutation.mutateAsync({
      garmentType: values.garmentType,
      inspirationMediaIds,
      ...(values.occasion ? { occasion: values.occasion } : {}),
      ...(values.eventDate ? { eventDate: values.eventDate } : {}),
      ...(values.budgetRange ? { budgetRange: values.budgetRange } : {}),
      ...(values.fabricPreference ? { fabricPreference: values.fabricPreference } : {}),
      ...(values.message ? { message: values.message } : {}),
    });
  }

  return {
    submit,
    quote: mutation.data,
    isSubmitting: mutation.isPending,
    isError: mutation.isError,
  };
}
