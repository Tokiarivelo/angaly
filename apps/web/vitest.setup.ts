import { File as NodeFile } from 'node:buffer';

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

import { server } from './src/lib/msw/server';

// jsdom's `File` doesn't implement `.stream()`, which undici's `Request` needs when a
// `File` is passed as a fetch body — MSW intercepts fetch via undici even under the jsdom
// test environment, so any hook doing a real PUT upload with a `File` body throws
// "object.stream is not a function" without this. Node's own `File` (from `node:buffer`)
// is undici-compatible and a drop-in Web File replacement — see
// docs/features/media.md "Tests" and useInspirationUpload/useMediaUpload.
global.File = NodeFile as unknown as typeof File;

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

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

// Default mock for NextAuth client hooks — prevents useSession throwing outside SessionProvider
vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'unauthenticated' }),
  getSession: () => Promise.resolve(null),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  signIn: vi.fn(),
  signOut: vi.fn(),
}));
