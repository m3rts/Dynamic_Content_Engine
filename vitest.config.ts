import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "packages/**/src/**/*.test.ts",
      "apps/web/src/**/*.test.ts",
      "apps/worker/src/**/*.test.ts",
    ],
    exclude: ["**/node_modules/**", "packages/**/src/integration/**", "apps/**/src/integration/**"],
    passWithNoTests: false,
  },
});
