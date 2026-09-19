import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "../../tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3100",
    channel: "chrome",
    trace: "on-first-retry",
    viewport: { height: 960, width: 1440 },
  },
  webServer: {
    command: "pnpm exec next start --hostname 127.0.0.1 --port 3100",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: "http://127.0.0.1:3100",
  },
});
