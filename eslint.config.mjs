import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import react from "eslint-plugin-react";
import globals from "globals";

export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      ".expo/**",
      "dist/**",
      "ios/**",
      "android/**",
      "build/**",
      "api/**",
    ],
  },
  // Node config files (CommonJS)
  {
    files: ["*.js", "*.cjs", "*.mjs"],
    ...js.configs.recommended,
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
  },
  // Landing JS files (browser)
  {
    files: ["landing/**/*.js"],
    ...js.configs.recommended,
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
  // Guard: forbid raw TextInput outside components/ui/
  {
    files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}"],
    ignores: [
      "components/ui/**",
      "components/filters/CityFnsCascade.tsx",
      "components/filters/SpecialistSearchBar.tsx",
      "components/onboarding/OtpCodeInput.tsx",
      "components/auth/OtpCodeInput.tsx",
      "components/requests/InlineOtpFlow.tsx",
    ],
    rules: {
      "no-restricted-imports": ["error", {
        paths: [{
          name: "react-native",
          importNames: ["TextInput"],
          message: "Use <Input> from @/components/ui/Input instead of raw TextInput. Add this file to ESLint ignores in eslint.config.mjs only if there's a strong reason."
        }]
      }]
    }
  },
  // TS/TSX files — full TS parser with project
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      "react-hooks": reactHooks,
      react,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.json",
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "no-console": "off",
    },
    extends: [...tseslint.configs.recommended],
  }
);
