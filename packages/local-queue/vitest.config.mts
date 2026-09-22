import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["../../tests/unit/local-queue/**/*.test.ts"],
  },
});
