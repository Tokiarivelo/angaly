'use client';

import { useMutation } from '@tanstack/react-query';
import { signIn } from 'next-auth/react';

import { apiClient } from '@/lib/api-client';

import type { ForgotPasswordFormValues } from '../schemas/forgot-password.schema';
import type { LoginFormValues } from '../schemas/login.schema';
import type { SignupFormValues } from '../schemas/signup.schema';
import type { AuthMode } from '../types/auth-form.types';

/**
 * Login/register both establish a session, so both go through NextAuth's
 * Credentials provider (apps/web/src/lib/auth/auth.ts) rather than calling
 * apps/api directly: in production, the reverse proxy routes the public
 * `/api/auth/*` path to this app for NextAuth's own routes (see
 * docker/nginx/conf.d/angaly.conf), so a direct browser call to
 * `/api/auth/login` would never reach apps/api there.
 */
async function signInCredentials(mode: AuthMode, payload: Record<string, string>): Promise<void> {
  const result = await signIn('credentials', { ...payload, mode, redirect: false });
  if (!result || result.error) {
    throw new Error(result?.error ?? 'Une erreur est survenue.');
  }
}

export function useLoginMutation() {
  return useMutation({
    mutationFn: (values: LoginFormValues) => signInCredentials('login', values),
  });
}

export function useSignupMutation() {
  return useMutation({
    mutationFn: (values: SignupFormValues) =>
      signInCredentials('register', {
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
        ...(values.phone && { phone: values.phone }),
      }),
  });
}

/**
 * Doesn't establish a session — called directly against apps/api. Real
 * endpoint (POST /api/auth/forgot-password, see docs/features/auth.md).
 */
export function useRequestPasswordResetMutation() {
  return useMutation({
    mutationFn: (values: ForgotPasswordFormValues) =>
      apiClient.post<{ message: string }>('/auth/forgot-password', values),
  });
}
