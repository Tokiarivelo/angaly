'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

import { REDIRECT_TO_PARAM } from '../consts/queryKeys';

/** Where a fresh session lands absent a `redirectTo` (see docs/pages/espace-client-dashboard.md). */
const DEFAULT_POST_LOGIN_ROUTE = '/espace-client';

/** Only a same-site relative path is honored — an absolute `redirectTo` (e.g. `https://evil.example`) is an open-redirect vector. */
function isSafeRedirectTarget(target: string | null): target is string {
  return Boolean(target) && target!.startsWith('/') && !target!.startsWith('//');
}

export function useAuthRedirect(): () => void {
  const searchParams = useSearchParams();

  return useCallback(() => {
    const redirectTo = searchParams.get(REDIRECT_TO_PARAM);
    // Full page load, not router.push: the login form may be an intercepted-route modal, and a soft
    // navigation from there re-uses the Router Cache entry for the target that was prefetched while
    // anonymous (a redirect to /connexion) — an endless /connexion loop despite a valid session.
    window.location.assign(isSafeRedirectTarget(redirectTo) ? redirectTo : DEFAULT_POST_LOGIN_ROUTE);
  }, [searchParams]);
}
