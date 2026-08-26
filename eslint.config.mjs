import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const taroGlobals = {
  defineAppConfig: 'readonly',
  definePageConfig: 'readonly',
};

export default [
  {
    ignores: ['**/node_modules/**', '**/dist/**', 'apps/miniapp/.temp/**', 'apps/miniapp/dist/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['apps/api/src/**/*.ts', 'apps/api/test/**/*.ts', 'apps/miniapp/src/**/*.{ts,tsx}', 'packages/shared/src/**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.node,
        ...globals.browser,
        ...taroGlobals,
      },
    },
    rules: {
      'no-undef': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
];
