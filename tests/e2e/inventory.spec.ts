import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";

import { hashSessionToken } from "../../apps/web/src/server/auth/session-service";

const databaseUrl = process.env["DATABASE_URL"];
const inventoryTest = databaseUrl ? test : test.skip;
const SESSION_TOKEN = "i".repeat(43);
const INVENTORY_EMAIL = "inventory-e2e@studiocar.test";
const SESSION_COOKIE_NAME = "__Host-studiocar_session";
const SESSION_COOKIE_SCOPE_URL = "https://localhost:3100";

inventoryTest(
  "renders authenticated inventory states at desktop and mobile widths",
  async ({ page }, testInfo) => {
    if (!databaseUrl) throw new Error("DATABASE_URL is required for this test.");
    const database = new Pool({ connectionString: databaseUrl, max: 1 });
    const userId = randomUUID();
    const vehicleId = randomUUID();
    const imageAssetId = randomUUID();

    try {
      await database.query('DELETE FROM "User" WHERE "primaryEmail" = $1', [
        INVENTORY_EMAIL,
      ]);
      await database.query(
        'INSERT INTO "User" ("id", "displayName", "primaryEmail", "updatedAt") VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
        [userId, "Inventory Test User", INVENTORY_EMAIL],
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

      await page.goto("/inventory");
      await expect(page.getByRole("heading", { name: "Inventory", level: 1 }))
        .toBeVisible();
      await expect(page.getByRole("heading", { name: "Your inventory is empty" }))
        .toBeVisible();
      await expect(page.getByRole("link", { name: /Inventory/ }))
        .toHaveAttribute("aria-current", "page");
      await page.screenshot({
        fullPage: true,
        path: testInfo.outputPath("desktop-empty-inventory.png"),
      });

      await database.query(
        'INSERT INTO "Vehicle" ("id", "userId", "name", "brand", "model", "year", "stockId", "status", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)',
        [
          vehicleId,
          userId,
          "2026 Audi Q5",
          "Audi",
          "Q5",
          2026,
          "SC-E2E-100",
          "PROCESSING",
        ],
      );
      await database.query(
        'INSERT INTO "ImageAsset" ("id", "userId", "vehicleId", "status", "originalObjectKey", "originalFilename", "mimeType", "sizeBytes", "uploadExpiresAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)',
        [
          imageAssetId,
          userId,
          vehicleId,
          "UPLOADED",
          `users/${userId}/vehicles/${vehicleId}/assets/${imageAssetId}/original/source.jpg`,
          "source.jpg",
          "image/jpeg",
          1024,
          new Date("2027-09-19T00:00:00.000Z"),
        ],
      );
      await database.query(
        'INSERT INTO "ProcessingJob" ("id", "userId", "vehicleId", "imageAssetId", "status", "provider", "options", "idempotencyKey", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)',
        [
          randomUUID(),
          userId,
          vehicleId,
          imageAssetId,
          "QUEUED",
          "REMOVEBG",
          JSON.stringify({
            background: "PREMIUM_WHITE",
            crop: "FIT",
            enhancement: false,
            outputFormat: "WEBP",
            padding: 0,
            platePrivacy: false,
            quality: 90,
            shadow: "NATURAL",
          }),
          "inventory-e2e-job-1",
        ],
      );

      await page.goto("/inventory");
      await expect(page.getByRole("heading", { name: "2026 Audi Q5" }))
        .toBeVisible();
      await expect(page.getByText("Processing", { exact: true })).toBeVisible();
      await expect(page.getByRole("progressbar", { name: "0 of 1 image complete" }))
        .toHaveAttribute("aria-valuenow", "0");
      await page.screenshot({
        fullPage: true,
        path: testInfo.outputPath("desktop-processing-inventory.png"),
      });

      await page.setViewportSize({ height: 844, width: 390 });
      await page.goto("/inventory?query=BMW");
      await expect(
        page.getByRole("heading", { name: "No vehicles match these filters" }),
      ).toBeVisible();
      await expect(page.getByRole("searchbox", { name: "Search inventory" }))
        .toHaveValue("BMW");
      await page.screenshot({
        fullPage: true,
        path: testInfo.outputPath("mobile-filtered-inventory.png"),
      });
    } finally {
      await database.query('DELETE FROM "User" WHERE "primaryEmail" = $1', [
        INVENTORY_EMAIL,
      ]);
      await database.end();
    }
  },
);
