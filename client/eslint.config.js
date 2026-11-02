import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended, // core JavaScript mistakes (unused vars, undefined names...)
      reactHooks.configs.flat['recommended-latest'], // rules of hooks + correct useEffect dependencies
      reactRefresh.configs.vite, // keeps hot reload working
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.browser, // window, localStorage, fetch...
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Allow unused names that start with a capital or _ (e.g. React components imported for JSX)
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
]);
