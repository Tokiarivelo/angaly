'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { AppointmentType } from '@angaly/types';

import { useAvailability, type UseAvailabilityResult } from './useAvailability';
import { useCreateAppointment } from './useCreateAppointment';
import { appointmentFormSchema, type AppointmentFormValues } from '../schemas/appointment.schema';

export interface UseAppointmentFormResult {
  register: ReturnType<typeof useForm<AppointmentFormValues>>['register'];
  handleSubmit: ReturnType<typeof useForm<AppointmentFormValues>>['handleSubmit'];
  errors: ReturnType<typeof useForm<AppointmentFormValues>>['formState']['errors'];
  onSubmit: (values: AppointmentFormValues) => void;
  isSubmitting: boolean;
  isError: boolean;
  selectedType: AppointmentType | '';
  atelierId: string;
  date: string;
  scheduledAt: string;
  selectType: (type: AppointmentType) => void;
  selectAtelier: (atelierId: string) => void;
  selectDate: (date: string) => void;
  selectSlot: (scheduledAt: string) => void;
  availability: UseAvailabilityResult;
}

/** All state/validation/submission for the booking form — `ui/` components only read this hook's output. */
export function useAppointmentForm(): UseAppointmentFormResult {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      type: '' as AppointmentType,
      atelierId: '',
      date: '',
      scheduledAt: '',
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      message: '',
    },
  });

  const selectedType = watch('type');
  const atelierId = watch('atelierId');
  const date = watch('date');
  const scheduledAt = watch('scheduledAt');

  const availability = useAvailability(atelierId);
  const { submit, isSubmitting, isError } = useCreateAppointment();

  const selectType = (type: AppointmentType) => setValue('type', type, { shouldValidate: true });

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

  return {
    register,
    handleSubmit,
    errors,
    onSubmit: submit,
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
  };
}
