/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\..*spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@core/(.*)$': '<rootDir>/core/$1',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '.interface.ts',
    '-interface.ts',
    'shared/testing',
    'shared-module/testing',
    'validator-rules.ts',
    '-fixture.ts',
    '.input.ts',
    '.d.ts',
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
  testEnvironment: 'node',
  setupFiles: ['reflect-metadata'],
  setupFilesAfterEnv: ['./core/shared/infra/testing/expect-helpers.ts'],
  coverageProvider: 'v8',
  clearMocks: true,
};

export default config;