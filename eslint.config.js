import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/.next/**",
      "apps/web/next.config.ts",
      "**/coverage/**",
      "scripts/**",
      "eslint.config.js",
      "packages/db/src/integration/**",
      "pnpm-lock.yaml",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    files: ["packages/**/*.ts", "vitest.config.ts"],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.eslint.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["apps/web/**/*.ts", "apps/web/**/*.tsx"],
    languageOptions: {
      parserOptions: {
        project: ["./apps/web/tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
);
