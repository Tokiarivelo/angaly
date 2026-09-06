import { z } from 'zod';

const envSchema = z.object({
  // Public (exposed to the browser)
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:3001/api'),
  NEXT_PUBLIC_WS_URL: z.string().default('ws://localhost:3001'),

  // Server-only
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(32),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

function parseEnv() {
  const parsed = envSchema.safeParse({
    NEXT_PUBLIC_API_URL: process.env['NEXT_PUBLIC_API_URL'],
    NEXT_PUBLIC_WS_URL: process.env['NEXT_PUBLIC_WS_URL'],
    NEXTAUTH_URL: process.env['NEXTAUTH_URL'],
    NEXTAUTH_SECRET: process.env['NEXTAUTH_SECRET'],
    NODE_ENV: process.env['NODE_ENV'],
  });

  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }

  return parsed.data;
}

export const env = parseEnv();
