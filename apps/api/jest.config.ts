import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.module.ts',
    '!**/index.ts',
    '!main.ts',
    '!**/*.spec.ts',
    '!**/prisma/prisma.service.ts',
    '!**/application/dtos/*.dto.ts',
  ],
  coverageDirectory: '../coverage',
  coverageProvider: 'babel',
  coverageThreshold: {
    // `branches` is capped below the 80% used for the other three metrics.
    // NestJS constructor/method parameter decorators (`@Inject()`, `@Body()`,
    // `@Query()`, ...) compile through TS's legacy decorator + parameter-
    // property emit, which both the v8 and babel coverage providers
    // misread as extra conditional branches that can never be satisfied
    // either way — verified on the `media` module (Phase 1), where every
    // real branch already sits at 100% and only these synthetic ones drag
    // the number down. Revisit upward once more modules dilute their share.
    global: {
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80,
    },
  },
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@angaly/types$': '<rootDir>/../../../packages/types/src/index.ts',
  },
};

export default config;
