import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";

import { hashSessionToken } from "../../apps/web/src/server/auth/session-service";

const databaseUrl = process.env["DATABASE_URL"];
const adminTest = databaseUrl ? test : test.skip;

/**
 * The set of administrators is global state, and one of these tests asserts
 * that only one exists. They must not run beside each other.
 */
test.describe.configure({ mode: "serial" });

const PLAIN_TOKEN = "a".repeat(43);
const ADMIN_TOKEN = "d".repeat(43);
const PLAIN_EMAIL = "admin-e2e-plain@studiocar.test";
const ADMIN_EMAIL = "admin-e2e-admin@studiocar.test";
const EDITOR_TOKEN = "e".repeat(43);
const EDITOR_EMAIL = "plan-editor-e2e@studiocar.test";
const EDITED_PLAN_KEY = "STUDIO_PRO";
/** A price nothing else in the product uses, so seeing it proves the edit. */
const EDITED_PRICE_RUPEES = "4321";
const EDITED_PRICE_LABEL = "₹4,321";
const SESSION_COOKIE_NAME = "__Host-studiocar_session";
const SESSION_COOKIE_SCOPE_URL = "https://localhost:3100";

adminTest(
  "keeps the administration area from everybody who is not an administrator",
  async ({ page }, testInfo) => {
    if (!databaseUrl)
      throw new Error("DATABASE_URL is required for this test.");
    const database = new Pool({ connectionString: databaseUrl, max: 1 });
    const plainId = randomUUID();
    const adminId = randomUUID();

    try {
      await database.query(
        'DELETE FROM "User" WHERE "primaryEmail" = ANY($1)',
        [[PLAIN_EMAIL, ADMIN_EMAIL]],
      );
      for (const [id, email, token] of [
        [plainId, PLAIN_EMAIL, PLAIN_TOKEN],
        [adminId, ADMIN_EMAIL, ADMIN_TOKEN],
      ] as const) {
        await database.query(
          'INSERT INTO "User" ("id", "displayName", "primaryEmail", "updatedAt") VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
          [id, "Admin Test User", email],
        );
        await database.query(
          'INSERT INTO "Session" ("id", "userId", "tokenHash", "expiresAt") VALUES ($1, $2, $3, $4)',
          [
            randomUUID(),
            id,
            hashSessionToken(token),
            new Date("2027-09-19T00:00:00.000Z"),
          ],
        );
      }
      await database.query(
        'INSERT INTO "UserRole" ("id", "userId", "role", "source") VALUES ($1, $2, $3, $4)',
        [randomUUID(), adminId, "ADMIN", "ADMIN_GRANT"],
      );

      async function signInAs(token: string): Promise<void> {
        await page.context().clearCookies();
        await page.context().addCookies([
          {
            name: SESSION_COOKIE_NAME,
            value: token,
            url: SESSION_COOKIE_SCOPE_URL,
            httpOnly: true,
            sameSite: "Lax",
            secure: true,
          },
        ]);
      }

      // A signed-in account without the role sees no entry and cannot reach the
      // page by typing its address.
      await signInAs(PLAIN_TOKEN);
      await page.goto("/dashboard");
      await expect(
        page
          .getByRole("navigation", { name: "Workspace" })
          .getByRole("link", { name: /Admin/ }),
      ).toHaveCount(0);

      const refused = await page.goto("/admin");
      expect(refused?.status()).toBe(404);

      // An administrator sees the entry and reaches the page.
      await signInAs(ADMIN_TOKEN);
      await page.goto("/dashboard");
      await expect(
        page
          .getByRole("navigation", { name: "Workspace" })
          .getByRole("link", { name: /Admin/ }),
      ).toBeVisible();

      const allowed = await page.goto("/admin");
      expect(allowed?.status()).toBe(200);
      await expect(
        page.getByRole("heading", { name: "Overview", level: 1 }),
      ).toBeVisible();
      await page.screenshot({
        fullPage: true,
        path: testInfo.outputPath("admin-overview.png"),
      });

      // The administrators page, where the only administrator cannot revoke
      // their own access.
      await page.goto("/admin/admins");
      await expect(
        page.getByRole("heading", { name: "Administrators", level: 1 }),
      ).toBeVisible();
      await expect(page.getByRole("button", { name: "Revoke" })).toBeDisabled();
      await expect(page.getByText("No invitations are waiting.")).toBeVisible();
      await page.screenshot({
        fullPage: true,
        path: testInfo.outputPath("admin-administrators.png"),
      });

      // A non-administrator cannot reach it either.
      await signInAs(PLAIN_TOKEN);
      const refusedAdmins = await page.goto("/admin/admins");
      expect(refusedAdmins?.status()).toBe(404);
    } finally {
      await database.query(
        'DELETE FROM "User" WHERE "primaryEmail" = ANY($1)',
        [[PLAIN_EMAIL, ADMIN_EMAIL]],
      );
      await database.end();
    }
  },
);

adminTest(
  "lets an administrator change a plan and shows it to everybody",
  async ({ page }, testInfo) => {
    if (!databaseUrl)
      throw new Error("DATABASE_URL is required for this test.");
    const database = new Pool({ connectionString: databaseUrl, max: 1 });
    const adminId = randomUUID();

    // The plan is configuration the deployment shares, so it is put back.
    const before = await database.query(
      'SELECT * FROM "PlanConfig" WHERE "planKey" = $1',
      [EDITED_PLAN_KEY],
    );

    try {
      await database.query('DELETE FROM "User" WHERE "primaryEmail" = $1', [
        EDITOR_EMAIL,
      ]);
      await database.query(
        'INSERT INTO "User" ("id", "displayName", "primaryEmail", "updatedAt") VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
        [adminId, "Plan Editor", EDITOR_EMAIL],
      );
      await database.query(
        'INSERT INTO "Session" ("id", "userId", "tokenHash", "expiresAt") VALUES ($1, $2, $3, $4)',
        [
          randomUUID(),
          adminId,
          hashSessionToken(EDITOR_TOKEN),
          new Date("2027-09-19T00:00:00.000Z"),
        ],
      );
      await database.query(
        'INSERT INTO "UserRole" ("id", "userId", "role", "source") VALUES ($1, $2, $3, $4)',
        [randomUUID(), adminId, "ADMIN", "ADMIN_GRANT"],
      );

      await page.context().addCookies([
        {
          name: SESSION_COOKIE_NAME,
          value: EDITOR_TOKEN,
          url: SESSION_COOKIE_SCOPE_URL,
          httpOnly: true,
          sameSite: "Lax",
          secure: true,
        },
      ]);

      await page.goto("/admin/pricing");
      await expect(
        page.getByRole("heading", { name: "Plans and pricing", level: 1 }),
      ).toBeVisible();

      const plan = page.locator(".admin-card", {
        has: page.getByRole("heading", { name: "Studio Pro", level: 2 }),
      });
      await plan.getByLabel(/^Price/).fill(EDITED_PRICE_RUPEES);
      await plan.getByRole("button", { name: "Save plan" }).click();
      await expect(plan.getByText("Plan updated.")).toBeVisible();
      await page.screenshot({
        fullPage: true,
        path: testInfo.outputPath("admin-pricing.png"),
      });

      // The whole point of the slice: configuration reaches the public page.
      await page.goto("/settings/billing");
      await expect(page.getByText(EDITED_PRICE_LABEL)).toBeVisible();

      await page.context().clearCookies();
      await page.goto("/");
      await expect(page.getByText(EDITED_PRICE_LABEL)).toBeVisible();
    } finally {
      await database.query('DELETE FROM "PlanConfig" WHERE "planKey" = $1', [
        EDITED_PLAN_KEY,
      ]);
      const [original] = before.rows;
      if (original) {
        const columns = Object.keys(original);
        await database.query(
          `INSERT INTO "PlanConfig" (${columns.map((column) => `"${column}"`).join(", ")}) VALUES (${columns.map((_column, index) => `$${String(index + 1)}`).join(", ")})`,
          columns.map((column) => original[column]),
        );
      }
      await database.query('DELETE FROM "User" WHERE "primaryEmail" = $1', [
        EDITOR_EMAIL,
      ]);
      await database.end();
    }
  },
);
