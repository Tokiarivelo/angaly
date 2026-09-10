'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { useSignupMutation } from '../api/auth.api';
import { signupSchema, type SignupFormValues } from '../schemas/signup.schema';
import { useAuthRedirect } from './useAuthRedirect';

export function useSignupForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  });

  const mutation = useSignupMutation();
  const redirectAfterLogin = useAuthRedirect();

  const onSubmit = (values: SignupFormValues) => {
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
