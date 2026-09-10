'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { useRequestPasswordResetMutation } from '../api/auth.api';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '../schemas/forgot-password.schema';

export function useForgotPasswordForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const mutation = useRequestPasswordResetMutation();

  const onSubmit = (values: ForgotPasswordFormValues) => {
    mutation.mutate(values);
  };

  return {
    register,
    handleSubmit,
    errors,
    onSubmit,
    isSubmitting: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
  };
}
