import { ESLint } from "eslint";

export default new ESLint({
  baseConfig: {
    extends: ["eslint:recommended", "plugin:react/recommended", "plugin:@typescript-eslint/recommended", "standard"],
    parser: "@typescript-eslint/parser",
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      ecmaFeatures: {
        jsx: true,
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      // Add your custom rules here
    },
  },
  ignorePatterns: ["node_modules/**", "dist/**"],
});
