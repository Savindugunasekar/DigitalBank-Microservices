import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist']),

  // ============================
  // 1) Base config for ALL files
  // ============================
  {
    files: ['**/*.ts', '**/*.tsx'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked,   // IMPORTANT
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },

  // ======================================================
  // 2) Customer App override → use customer-app tsconfig
  // ======================================================
  {
    files: ['frontend/customer-app/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: './frontend/customer-app/tsconfig.json',
        tsconfigRootDir: new URL('.', import.meta.url).pathname,
      },
    },
  },

  // ======================================================
  // 3) Admin App override → use admin-app tsconfig
  // ======================================================
  {
    files: ['frontend/admin-app/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: './frontend/admin-app/tsconfig.json',
        tsconfigRootDir: new URL('.', import.meta.url).pathname,
      },
    },
  },
]);
