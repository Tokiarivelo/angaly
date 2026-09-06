import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// MSW server wiring is added in docs/phases/phase-1-digital-presence.md once
// the first feature makes real API calls — see docs/testing.md.

afterEach(() => {
  cleanup();
});

// Mock Next.js router — every feature hook that calls useRouter()/usePathname()
// gets a safe default without needing a real Next.js runtime in unit tests.
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));
