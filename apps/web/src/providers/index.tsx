import { SessionProvider } from 'next-auth/react';

import { QueryProvider } from './QueryProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchInterval={4 * 60} refetchOnWindowFocus={true}>
      <QueryProvider>{children}</QueryProvider>
    </SessionProvider>
  );
}
