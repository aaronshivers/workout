import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-plugin-prettier';
import typescript from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';

export default [
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
      prettier,
      '@typescript-eslint': typescript,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        project: './tsconfig.eslint.json', //  Point to the ESLint-specific tsconfig!
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        React: 'readonly', // Add React to globals to suppress no-undef
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...typescript.configs['eslint-recommended'].rules,
      ...typescript.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'prettier/prettier': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      "react/prop-types": "off", // Disable prop-types with TypeScript
      quotes: ['warn', 'single'],
    },
  },
];
