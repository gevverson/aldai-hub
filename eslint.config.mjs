import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

/**
 * Flat ESLint config covering both JS workspaces (client + server).
 *
 * Deliberately close to `js.configs.recommended` rather than a large opinionated
 * ruleset: the point is to catch real mistakes — an unused import, a missing
 * dependency in a hook, an accidental global — not to relitigate style across a
 * codebase that is already internally consistent. A linter that reports hundreds
 * of cosmetic findings on day one gets switched off by day two.
 */
export default [
  {
    ignores: [
      '**/node_modules/**',
      'client/dist/**',
      'ai-service/**',          // Python
      'playwright-report/**',
      'test-results/**',
      'server/uploads/**',
      // Generated data. seed.js alone is ~1.5k machine-written project literals;
      // regenerate it with the pipeline, don't hand-edit it to satisfy a linter.
      'server/data/seed*.js',
      'server/data/geography.js',
      'server/data/build_production_seed.mjs',
    ],
  },

  js.configs.recommended,

  // ── Client (React, browser) ──────────────────────────────────
  {
    files: ['client/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: '18.3' } },
    plugins: { react, 'react-hooks': reactHooks },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat['jsx-runtime'].rules,
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react/prop-types': 'off',   // no PropTypes in this codebase, by choice
      // Typography, not correctness. The copy on this site is bilingual and full
      // of quoted audit language; forcing &quot; through it makes the source
      // harder to read and proofread for no behavioural gain.
      'react/no-unescaped-entities': 'off',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },

  // ── Server (Node, ESM) ───────────────────────────────────────
  {
    files: ['server/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_|^next$' }],
      'no-console': 'off',        // the server logs deliberately
    },
  },

  // ── Build config (Node context, despite living in client/) ───
  {
    files: ['**/*.config.js', '**/*.config.mjs'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.node },
    },
  },

  // ── Tests ────────────────────────────────────────────────────
  // Playwright specs run in Node, but page.evaluate() callbacks are serialised
  // and executed in the browser, so both global sets are legitimately in scope.
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser },
    },
  },
];
