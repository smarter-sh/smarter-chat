import { ESLint } from "eslint";

export default new ESLint({
  baseConfig: {
    env: {
      browser: true,
      es2021: true,
    },
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
    plugins: ["react"],
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["error"],
      "no-undef": "off",
      "react/prop-types": "off",
      "react/no-unused-prop-types": "off",
    },
  },
  ignore: true,
  ignorePatterns: ["node_modules/**", "dist/**"],
});
