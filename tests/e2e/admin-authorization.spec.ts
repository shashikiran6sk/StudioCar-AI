import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";

import { hashSessionToken } from "../../apps/web/src/server/auth/session-service";

const databaseUrl = process.env["DATABASE_URL"];
const adminTest = databaseUrl ? test : test.skip;
const PLAIN_TOKEN = "a".repeat(43);
const ADMIN_TOKEN = "d".repeat(43);
const PLAIN_EMAIL = "admin-e2e-plain@studiocar.test";
const ADMIN_EMAIL = "admin-e2e-admin@studiocar.test";
const SESSION_COOKIE_NAME = "__Host-studiocar_session";
const SESSION_COOKIE_SCOPE_URL = "https://localhost:3100";

adminTest(
  "keeps the administration area from everybody who is not an administrator",
  async ({ page }, testInfo) => {
    if (!databaseUrl) throw new Error("DATABASE_URL is required for this test.");
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
    } finally {
      await database.query(
        'DELETE FROM "User" WHERE "primaryEmail" = ANY($1)',
        [[PLAIN_EMAIL, ADMIN_EMAIL]],
      );
      await database.end();
    }
  },
);
