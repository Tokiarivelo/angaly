import tseslint from 'typescript-eslint';

import nextjsConfig from '@angaly/eslint-config/nextjs';

export default tseslint.config(
  {
    ignores: [
      'eslint.config.mjs',
      'next.config.ts',
      'postcss.config.mjs',
      'tailwind.config.ts',
      '.next/**',
      'dist/**',
      'playwright-report/**',
      'test-results/**',
      'blob-report/**',
      'public/**',
      '**/__tests__/**',
      '**/*.{test,spec}.{ts,tsx,js,jsx}',
    ],
  },
  ...nextjsConfig,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    },
  },
);
