import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

// Shared no-restricted-syntax rules for Phase 4 UI guardrails.
// Blocks raw hex literals and raw numeric fontSize props from sneaking back
// into app/** and components/** — enforcing use of Colors.<token> and
// Typography.<key> tokens from constants/.
const uiGuardrailSelectors = [
  {
    selector: "Literal[value=/^#[0-9a-fA-F]{3,8}$/]",
    message:
      'Raw hex literals are forbidden outside Colors.ts/palette.js/tailwind.config.js. Use Colors.<token> from constants/Colors.ts.',
  },
  {
    selector: "TemplateElement[value.raw=/#[0-9a-fA-F]{3,8}/]",
    message: 'Raw hex in template literal. Use Colors.<token>.',
  },
  {
    selector:
      "Property[key.name='fontSize'][value.type='Literal'][value.raw=/^[0-9]+(\\.[0-9]+)?$/]",
    message: 'Raw numeric fontSize forbidden. Use Typography.<key>.',
  },
  {
    selector:
      "Property[key.name='color'][value.type='Literal'][value.value=/^#[0-9a-fA-F]{3,8}$/]",
    message: 'Raw hex color prop. Use Colors.<token>.',
  },
  {
    selector:
      "Property[key.name='backgroundColor'][value.type='Literal'][value.value=/^#[0-9a-fA-F]{3,8}$/]",
    message: 'Raw hex backgroundColor. Use Colors.<token>.',
  },
  {
    selector:
      "Property[key.name='borderColor'][value.type='Literal'][value.value=/^#[0-9a-fA-F]{3,8}$/]",
    message: 'Raw hex borderColor. Use Colors.<token>.',
  },
];

export default [
  {
    ignores: ['node_modules/**', 'dist/**', '.expo/**', 'api/**'],
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/ban-ts-comment': 'warn',
    },
  },
  // Phase 4 UI guardrails — block raw hex + raw fontSize in app/components
  {
    files: [
      'app/**/*.ts',
      'app/**/*.tsx',
      'components/**/*.ts',
      'components/**/*.tsx',
    ],
    ignores: [
      'constants/Colors.ts',
      'constants/palette.js',
      'tailwind.config.js',
      'components/ui/**',
      'app/_dev/**',
    ],
    rules: {
      'no-restricted-syntax': ['warn', ...uiGuardrailSelectors],
    },
  },
];
