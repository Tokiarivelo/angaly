import type { Role } from '@angaly/types';
import type { DefaultSession } from 'next-auth';
import type { JWT as DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    accessTokenExpiresAt?: number;
    error?: 'RefreshAccessTokenError';
    user: {
      id: string;
      role: Role;
    } & DefaultSession['user'];
  }

  interface User {
    role: Role;
    accessToken: string;
    accessTokenExpiresAt: number;
    refreshToken: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    userId?: string;
    role?: Role;
    accessToken?: string;
    accessTokenExpiresAt?: number;
    refreshToken?: string;
    error?: 'RefreshAccessTokenError';
  }
}
