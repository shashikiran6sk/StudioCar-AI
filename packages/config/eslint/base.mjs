import eslint from "@eslint/js";
import globals from "globals";
import typescriptEslint from "typescript-eslint";

export default typescriptEslint.config(
  {
    ignores: ["dist/**", "coverage/**", "node_modules/**"],
  },
  eslint.configs.recommended,
  ...typescriptEslint.configs.strictTypeChecked,
  {
    ...typescriptEslint.configs.disableTypeChecked,
    files: ["**/*.{js,mjs,cjs}"],
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { "fixStyle": "inline-type-imports" }
      ],
      "@typescript-eslint/no-import-type-side-effects": "error"
    }
  }
);
