'use client';

import { useSession } from 'next-auth/react';

import { Role } from '@angaly/types';

/** Same roles the (admin) layout lets through — keep in sync with apps/web/src/app/(admin)/layout.tsx. */
const STAFF_ROLES: Role[] = [Role.COUTURIERE, Role.MANAGER, Role.ADMIN];

export function useIsStaff(): boolean {
  const { data: session } = useSession();
  return session?.user ? STAFF_ROLES.includes(session.user.role) : false;
}
