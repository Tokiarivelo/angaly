'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

import { REDIRECT_TO_PARAM } from '../consts/queryKeys';

/** Where a fresh session lands absent a `redirectTo` (see docs/pages/espace-client-dashboard.md). */
const DEFAULT_POST_LOGIN_ROUTE = '/espace-client';

/** Only a same-site relative path is honored — an absolute `redirectTo` (e.g. `https://evil.example`) is an open-redirect vector. */
function isSafeRedirectTarget(target: string | null): target is string {
  return Boolean(target) && target!.startsWith('/') && !target!.startsWith('//');
}

export function useAuthRedirect(): () => void {
  const router = useRouter();
  const searchParams = useSearchParams();

  return useCallback(() => {
    const redirectTo = searchParams.get(REDIRECT_TO_PARAM);
    router.push(isSafeRedirectTarget(redirectTo) ? redirectTo : DEFAULT_POST_LOGIN_ROUTE);
  }, [router, searchParams]);
}
