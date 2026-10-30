import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";

import { hashSessionToken } from "../../apps/web/src/server/auth/session-service";

const databaseUrl = process.env["DATABASE_URL"];
const signedInTest = databaseUrl ? test : test.skip;
const SESSION_TOKEN = "b".repeat(43);
const PRICING_EMAIL = "pricing-e2e@studiocar.test";
const SESSION_COOKIE_NAME = "__Host-studiocar_session";
const SESSION_COOKIE_SCOPE_URL = "https://localhost:3100";
const BILLING_PACKS_URL = /\/settings\/billing#packs$/;

test("sends a signed-out paid plan choice through sign-in to the Billing packs", async ({
  page,
}) => {
  await page.goto("/#pricing");

  await page.getByRole("link", { name: "Choose Studio Plus" }).click();

  await expect(page).toHaveURL(/\/login\?returnTo=%2Fsettings%2Fbilling%23packs$/);
  await expect(
    page.getByRole("link", { name: "Continue with Google" }),
  ).toHaveAttribute(
    "href",
    "/api/auth/google/start?returnTo=%2Fsettings%2Fbilling%23packs",
  );
});

signedInTest(
  "takes a signed-in paid plan choice straight to the Billing packs",
  async ({ page }, testInfo) => {
    if (!databaseUrl) throw new Error("DATABASE_URL is required for this test.");
    const database = new Pool({ connectionString: databaseUrl, max: 1 });
    const userId = randomUUID();

    try {
      await database.query('DELETE FROM "User" WHERE "primaryEmail" = $1', [
        PRICING_EMAIL,
      ]);
      await database.query(
        'INSERT INTO "User" ("id", "displayName", "primaryEmail", "updatedAt") VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
        [userId, "Pricing Test User", PRICING_EMAIL],
      );
      await database.query(
        'INSERT INTO "Session" ("id", "userId", "tokenHash", "expiresAt") VALUES ($1, $2, $3, $4)',
        [
          randomUUID(),
          userId,
          hashSessionToken(SESSION_TOKEN),
          new Date("2027-09-19T00:00:00.000Z"),
        ],
      );
      await page.context().addCookies([
        {
          name: SESSION_COOKIE_NAME,
          value: SESSION_TOKEN,
          url: SESSION_COOKIE_SCOPE_URL,
          httpOnly: true,
          sameSite: "Lax",
          secure: true,
        },
      ]);

      await page.goto("/#pricing");
      await page.getByRole("link", { name: "Choose Studio Pro" }).click();

      await expect(page).toHaveURL(BILLING_PACKS_URL);
      await expect(
        page.getByRole("heading", {
          name: "Choose the capacity that fits your inventory.",
        }),
      ).toBeInViewport();
      await page.screenshot({
        path: testInfo.outputPath("billing-packs-from-pricing.png"),
      });

      // The free plan still starts in the workspace.
      await page.goto("/#pricing");
      await page
        .locator(".pricing-section")
        .getByRole("link", { name: "Start free" })
        .click();
      await expect(page).toHaveURL(/\/dashboard$/);
    } finally {
      await database.query('DELETE FROM "User" WHERE "primaryEmail" = $1', [
        PRICING_EMAIL,
      ]);
      await database.end();
    }
  },
);
