import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const directory = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@studiocar/contracts": path.resolve(
        directory,
        "../../packages/contracts/src/index.ts",
      ),
      "@studiocar/processing": path.resolve(
        directory,
        "../../packages/processing/src/index.ts",
      ),
    },
  },
  test: {
    environment: "node",
    include: ["../../tests/unit/workers/image-processing/**/*.test.ts"],
  },
});
