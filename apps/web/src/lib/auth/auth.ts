import NextAuth, { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

import { env } from '@/lib/env';

import { loginWithBackend, logoutWithBackend, refreshWithBackend, registerWithBackend } from './backend-auth-client';
import { maybeRefreshToken } from './refresh-jwt';

function readCredential(credentials: Partial<Record<string, unknown>>, key: string): string | undefined {
  const value = credentials[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  secret: env.NEXTAUTH_SECRET,
  pages: { signIn: '/connexion' },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        mode: {},
        email: {},
        password: {},
        firstName: {},
        lastName: {},
        phone: {},
      },
      async authorize(credentials) {
        const email = readCredential(credentials, 'email');
        const password = readCredential(credentials, 'password');
        if (!email || !password) {
          throw new CredentialsSignin('Identifiants manquants.');
        }

        try {
          const phone = readCredential(credentials, 'phone');
          const backendSession =
            readCredential(credentials, 'mode') === 'register'
              ? await registerWithBackend({
                  email,
                  password,
                  firstName: readCredential(credentials, 'firstName') ?? '',
                  lastName: readCredential(credentials, 'lastName') ?? '',
                  ...(phone !== undefined && { phone }),
                })
              : await loginWithBackend(email, password);

          return {
            id: backendSession.user.id,
            email: backendSession.user.email,
            role: backendSession.user.role,
            accessToken: backendSession.accessToken,
            accessTokenExpiresAt: backendSession.accessTokenExpiresAt,
            refreshToken: backendSession.refreshToken,
          };
        } catch (error) {
          throw new CredentialsSignin(error instanceof Error ? error.message : 'Une erreur est survenue.');
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user?.id) {
        token.userId = user.id;
        token.role = user.role;
        token.accessToken = user.accessToken;
        token.accessTokenExpiresAt = user.accessTokenExpiresAt;
        token.refreshToken = user.refreshToken;
        delete token.error;
        return token;
      }

      const isForceRefresh =
        trigger === 'update' ||
        Boolean((session as Record<string, unknown> | undefined)?.['forceRefresh']);

      return maybeRefreshToken(token, isForceRefresh, refreshWithBackend);
    },
    session({ session, token }) {
      if (token.error === 'RefreshAccessTokenError' || !token.userId) {
        session.error = 'RefreshAccessTokenError';
        // @ts-expect-error - Clear user to indicate unauthenticated session
        session.user = undefined;
        delete session.accessToken;
        delete session.accessTokenExpiresAt;
        return session;
      }
      if (token.userId) {
        session.user.id = token.userId;
      }
      if (token.role) {
        session.user.role = token.role;
      }
      if (token.accessToken) {
        session.accessToken = token.accessToken;
      }
      if (token.accessTokenExpiresAt) {
        session.accessTokenExpiresAt = token.accessTokenExpiresAt;
      }
      if (token.error) {
        session.error = token.error;
      }
      return session;
    },
  },
  events: {
    async signOut(message) {
      const token = 'token' in message ? message.token : undefined;
      if (!token?.accessToken || !token.refreshToken) {
        return;
      }
      try {
        await logoutWithBackend(token.accessToken, token.refreshToken);
      } catch {
        // Best-effort revocation — an unrevoked refresh token still expires naturally (see docs/features/auth.md).
      }
    },
  },
});
