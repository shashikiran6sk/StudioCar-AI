import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { environment: "node", include: ["../../tests/unit/workers/email-delivery/**/*.test.ts"] },
});
