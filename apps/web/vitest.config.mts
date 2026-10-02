import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const directory = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(directory, "src"),
      next: path.resolve(directory, "node_modules/next"),
    },
  },
  test: {
    environment: "jsdom",
    include: ["../../tests/unit/{app,features,lib,server}/**/*.test.{ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"],
  },
});
