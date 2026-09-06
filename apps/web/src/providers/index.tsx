import { QueryProvider } from './QueryProvider';

// NextAuth's SessionProvider is added here in
// docs/phases/phase-1-digital-presence.md once the `auth` feature exists.
export function Providers({ children }: { children: React.ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>;
}
