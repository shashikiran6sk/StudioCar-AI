import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";

import { hashSessionToken } from "../../apps/web/src/server/auth/session-service";

const databaseUrl = process.env["DATABASE_URL"];
const workspaceTest = databaseUrl ? test : test.skip;
const SESSION_TOKEN = "w".repeat(43);
const WORKSPACE_EMAIL = "workspace-e2e@studiocar.test";
const SESSION_COOKIE_NAME = "__Host-studiocar_session";
const SESSION_COOKIE_SCOPE_URL = "https://localhost:3100";

workspaceTest(
  "offers exactly the delivered workspace destinations and a plan summary",
  async ({ page }, testInfo) => {
    if (!databaseUrl) throw new Error("DATABASE_URL is required for this test.");
    const database = new Pool({ connectionString: databaseUrl, max: 1 });
    const userId = randomUUID();

    try {
      await database.query('DELETE FROM "User" WHERE "primaryEmail" = $1', [
        WORKSPACE_EMAIL,
      ]);
      await database.query(
        'INSERT INTO "User" ("id", "displayName", "primaryEmail", "updatedAt") VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
        [userId, "Workspace Test User", WORKSPACE_EMAIL],
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

      await page.goto("/dashboard");

      const navigation = page.getByRole("navigation", { name: "Workspace" });
      await expect(navigation.getByRole("link", { name: /Dashboard/ })).toBeVisible();
      await expect(navigation.getByRole("link", { name: /Inventory/ })).toBeVisible();
      await expect(
        navigation.getByRole("link", { name: /Packs & Billing/ }),
      ).toBeVisible();
      await expect(navigation.getByRole("link", { name: /Profile/ })).toBeVisible();
      await expect(navigation.getByRole("link")).toHaveCount(4);

      // The retired destinations must be gone, not merely inert.
      await expect(navigation.getByRole("link", { name: /Portfolio/ })).toHaveCount(0);
      await expect(navigation.getByRole("link", { name: /^Usage/ })).toHaveCount(0);
      await expect(navigation.getByRole("link", { name: /Help/ })).toHaveCount(0);

      await expect(
        page.getByRole("progressbar", { name: /images used/ }),
      ).toBeVisible();

      // Each quick action shows its own imagery, described for assistive
      // technology rather than hidden.
      await expect(
        page.getByRole("heading", { name: "Upload a vehicle" }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "View inventory" }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Recent results" }),
      ).toBeVisible();
      const actionImages = page.locator(".dashboard-action-card__media img");
      await expect(actionImages).toHaveCount(3);
      const sources = await actionImages.evaluateAll((images) =>
        images.map((image) =>
          decodeURIComponent(image.getAttribute("src") ?? ""),
        ),
      );
      expect(new Set(sources).size).toBe(3);

      await page.screenshot({
        fullPage: true,
        path: testInfo.outputPath("workspace-dashboard.png"),
      });

      // The homepage recognises a signed-in visitor instead of inviting them
      // to sign in again.
      await page.goto("/");
      const header = page.locator(".marketing-header");
      await expect(header.getByRole("link", { name: "Dashboard" })).toBeVisible();
      await expect(header.getByRole("link", { name: "Log in" })).toHaveCount(0);
      await header.screenshot({
        path: testInfo.outputPath("homepage-signed-in-header.png"),
      });
      await page.goto("/dashboard");

      await navigation.getByRole("link", { name: /Profile/ }).click();
      await expect(page).toHaveURL(/\/settings\/profile$/);
      await expect(
        page.getByRole("heading", { name: "Profile & security" }),
      ).toBeVisible();
      await expect(
        page.getByRole("navigation", { name: "Workspace" }).getByRole("link", {
          name: /Profile/,
        }),
      ).toHaveAttribute("aria-current", "page");
    } finally {
      await database.query('DELETE FROM "User" WHERE "primaryEmail" = $1', [
        WORKSPACE_EMAIL,
      ]);
      await database.end();
    }
  },
);
