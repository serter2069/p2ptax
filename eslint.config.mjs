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
