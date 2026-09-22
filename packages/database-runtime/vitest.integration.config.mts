import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["../../tests/integration/database-runtime/**/*.test.ts"],
    maxWorkers: 1,
  },
});
