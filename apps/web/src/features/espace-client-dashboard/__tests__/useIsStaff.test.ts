import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Role } from '@angaly/types';

import { useIsStaff } from '../hooks/useIsStaff';

const useSessionMock = vi.fn();
vi.mock('next-auth/react', () => ({ useSession: () => useSessionMock() }));

describe('useIsStaff', () => {
  it.each([Role.ADMIN, Role.MANAGER, Role.COUTURIERE])('is true for %s', (role) => {
    useSessionMock.mockReturnValue({ data: { user: { role } } });
    expect(renderHook(() => useIsStaff()).result.current).toBe(true);
  });

  it('is false for a client', () => {
    useSessionMock.mockReturnValue({ data: { user: { role: Role.CLIENT } } });
    expect(renderHook(() => useIsStaff()).result.current).toBe(false);
  });

  it('is false without a session', () => {
    useSessionMock.mockReturnValue({ data: null });
    expect(renderHook(() => useIsStaff()).result.current).toBe(false);
  });
});
