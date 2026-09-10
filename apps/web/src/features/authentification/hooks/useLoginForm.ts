'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { useLoginMutation } from '../api/auth.api';
import { loginSchema, type LoginFormValues } from '../schemas/login.schema';
import { useAuthRedirect } from './useAuthRedirect';

export function useLoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const mutation = useLoginMutation();
  const redirectAfterLogin = useAuthRedirect();

  const onSubmit = (values: LoginFormValues) => {
    mutation.mutate(values, { onSuccess: redirectAfterLogin });
  };

  return {
    register,
    handleSubmit,
    errors,
    onSubmit,
    isSubmitting: mutation.isPending,
    isError: mutation.isError,
    errorMessage: mutation.error instanceof Error ? mutation.error.message : null,
  };
}
