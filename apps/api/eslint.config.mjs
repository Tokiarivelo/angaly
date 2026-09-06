import tseslint from 'typescript-eslint';

import nestjsConfig from '@angaly/eslint-config/nestjs';

export default tseslint.config(
  { ignores: ['eslint.config.mjs', 'jest.config.ts', 'dist/**'] },
  ...nestjsConfig,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'no-console': 'off',
    },
  },
);
