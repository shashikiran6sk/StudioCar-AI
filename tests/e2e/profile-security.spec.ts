import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { Pool, type QueryResultRow } from "pg";

import { hashSessionToken } from "../../apps/web/src/server/auth/session-service";

const databaseUrl = process.env["DATABASE_URL"];
const profileTest = databaseUrl ? test : test.skip;
const SESSION_TOKEN = "p".repeat(43);
const OTHER_SESSION_TOKEN = "o".repeat(43);
const PROFILE_EMAIL = "profile-e2e@studiocar.test";
const SESSION_COOKIE_NAME = "__Host-studiocar_session";
const APPLICATION_URL = "http://127.0.0.1:3100";

interface DisplayNameRow extends QueryResultRow {
  displayName: string | null;
}

interface SessionCountRow extends QueryResultRow {
  count: string;
}

profileTest(
  "updates a profile and revokes every active session",
  async ({ page }, testInfo) => {
    if (!databaseUrl) throw new Error("DATABASE_URL is required for this test.");
    const database = new Pool({ connectionString: databaseUrl, max: 1 });
    const userId = randomUUID();

    try {
      await database.query('DELETE FROM "User" WHERE "primaryEmail" = $1', [
        PROFILE_EMAIL,
      ]);
      await database.query(
        'INSERT INTO "User" ("id", "displayName", "primaryEmail", "updatedAt") VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
        [userId, "Profile Test User", PROFILE_EMAIL],
      );
      await database.query(
        'INSERT INTO "AuthIdentity" ("id", "userId", "provider", "providerSubject", "email", "emailVerifiedAt", "lastAuthenticatedAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
        [
          randomUUID(),
          userId,
          "GOOGLE",
          "profile-e2e-google-subject",
          PROFILE_EMAIL,
        ],
      );
      await database.query(
        'INSERT INTO "Session" ("id", "userId", "tokenHash", "expiresAt") VALUES ($1, $2, $3, $4), ($5, $2, $6, $4)',
        [
          randomUUID(),
          userId,
          hashSessionToken(SESSION_TOKEN),
          new Date("2027-09-19T00:00:00.000Z"),
          randomUUID(),
          hashSessionToken(OTHER_SESSION_TOKEN),
        ],
      );
      await page.context().addCookies([
        {
          name: SESSION_COOKIE_NAME,
          value: SESSION_TOKEN,
          url: APPLICATION_URL,
          httpOnly: true,
          sameSite: "Lax",
          secure: true,
        },
      ]);

      await page.goto("/settings/profile");

      await expect(
        page.getByRole("heading", { name: "Profile & security" }),
      ).toBeVisible();
      await expect(page.getByText(PROFILE_EMAIL).first()).toBeVisible();
      await expect(page.getByText("2", { exact: true })).toBeVisible();

      await page.getByLabel("Display name").fill("Updated Profile User");
      await page.getByRole("button", { name: "Save profile" }).click();
      await expect(page.getByRole("status")).toHaveText("Profile updated.");
      const updatedUser = await database.query<DisplayNameRow>(
        'SELECT "displayName" FROM "User" WHERE "id" = $1',
        [userId],
      );
      expect(updatedUser.rows[0]?.displayName).toBe("Updated Profile User");
      await page.screenshot({
        fullPage: true,
        path: testInfo.outputPath("authenticated-profile.png"),
      });

      await page.getByRole("button", { name: "Log out all devices" }).click();

      await expect(page).toHaveURL(/\/login$/);
      const activeSessions = await database.query<SessionCountRow>(
        'SELECT COUNT(*) AS "count" FROM "Session" WHERE "userId" = $1 AND "revokedAt" IS NULL',
        [userId],
      );
      expect(activeSessions.rows[0]?.count).toBe("0");
    } finally {
      await database.query('DELETE FROM "User" WHERE "primaryEmail" = $1', [
        PROFILE_EMAIL,
      ]);
      await database.end();
    }
  },
);
