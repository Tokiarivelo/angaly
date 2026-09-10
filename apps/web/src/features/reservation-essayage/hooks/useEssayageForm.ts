'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { useAvailability, type UseAvailabilityResult } from './useAvailability';
import { useCreateEssayageAppointment } from './useCreateEssayageAppointment';
import { useProductContext, type UseProductContextResult } from './useProductContext';
import { essayageReservationSchema, type EssayageReservationValues } from '../schemas/essayage-reservation.schema';

export interface UseEssayageFormResult {
  register: ReturnType<typeof useForm<EssayageReservationValues>>['register'];
  handleSubmit: ReturnType<typeof useForm<EssayageReservationValues>>['handleSubmit'];
  errors: ReturnType<typeof useForm<EssayageReservationValues>>['formState']['errors'];
  onSubmit: (values: EssayageReservationValues) => void;
  isSubmitting: boolean;
  isError: boolean;
  size: string;
  atelierId: string;
  date: string;
  scheduledAt: string;
  selectSize: (size: string) => void;
  selectAtelier: (atelierId: string) => void;
  selectDate: (date: string) => void;
  selectSlot: (scheduledAt: string) => void;
  availability: UseAvailabilityResult;
  productContext: UseProductContextResult;
}

/** All state/validation/submission for the essayage reservation form — `ui/` components only read this hook's output. */
export function useEssayageForm(): UseEssayageFormResult {
  const productContext = useProductContext();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EssayageReservationValues>({
    resolver: zodResolver(essayageReservationSchema),
    defaultValues: { size: '', atelierId: '', date: '', scheduledAt: '', firstName: '', lastName: '', phone: '', email: '' },
  });

  const size = watch('size');
  const atelierId = watch('atelierId');
  const date = watch('date');
  const scheduledAt = watch('scheduledAt');

  useEffect(() => {
    if (productContext.sizeFromUrl) {
      setValue('size', productContext.sizeFromUrl);
    }
    // Only ever runs once the URL's `size` param resolves — never overwrites a manual pick afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productContext.sizeFromUrl]);

  const availability = useAvailability(atelierId);
  const { submit, isSubmitting, isError } = useCreateEssayageAppointment();

  const selectSize = (nextSize: string) => setValue('size', nextSize, { shouldValidate: true });

  const selectAtelier = (nextAtelierId: string) => {
    setValue('atelierId', nextAtelierId, { shouldValidate: true });
    setValue('date', '');
    setValue('scheduledAt', '');
  };

  const selectDate = (nextDate: string) => {
    setValue('date', nextDate, { shouldValidate: true });
    setValue('scheduledAt', '');
    availability.selectDate(nextDate);
  };

  const selectSlot = (nextScheduledAt: string) => setValue('scheduledAt', nextScheduledAt, { shouldValidate: true });

  const onSubmit = (values: EssayageReservationValues) => submit(values, productContext.product);

  return {
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
  };
}
