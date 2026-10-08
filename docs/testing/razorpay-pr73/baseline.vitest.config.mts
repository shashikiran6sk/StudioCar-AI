import path from "node:path";
import { defineConfig } from "vitest/config";

const root = path.resolve(import.meta.dirname, "../../..");
export default defineConfig({
  resolve: { alias: {
    "@studiocar/contracts": path.join(root, "packages/contracts/src/index.ts"),
    "@studiocar/processing": path.join(root, "packages/processing/src/index.ts"),
    "@studiocar/observability": path.join(root, "packages/observability/src/index.ts"),
    "@studiocar/database-runtime": path.join(root, "packages/database-runtime/src/index.ts"),
  } },
  test: {
    environment: "node",
    include: [path.join(root, "docs/testing/razorpay-pr73/evidence/**/*.test.ts")],
    maxWorkers: 1,
    reporters: ["verbose"],
  },
});
