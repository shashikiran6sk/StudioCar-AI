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
const PRIVATE_S3_ROUTE = "https://studiocar-ci-private.s3.ap-south-1.amazonaws.com/**";
const TEST_IMAGE = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
    <rect width="1280" height="720" fill="#e8e8e5"/>
    <path d="M245 445h790l-80-170H390z" fill="#25272b"/>
    <circle cx="410" cy="480" r="72" fill="#101114"/>
    <circle cx="870" cy="480" r="72" fill="#101114"/>
  </svg>
`;

inventoryTest(
  "renders authenticated inventory states at desktop and mobile widths",
  async ({ page }, testInfo) => {
    if (!databaseUrl) throw new Error("DATABASE_URL is required for this test.");
    const database = new Pool({ connectionString: databaseUrl, max: 1 });
    const userId = randomUUID();
    const vehicleId = randomUUID();
    const imageAssetId = randomUUID();
    const jobId = randomUUID();

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
      await page.route(PRIVATE_S3_ROUTE, async (route) => {
        await route.fulfill({
          body: TEST_IMAGE,
          contentType: "image/svg+xml",
          status: 200,
        });
      });

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
          jobId,
          userId,
          vehicleId,
          imageAssetId,
          "QUEUED",
          "REMOVEBG",
          JSON.stringify({
            backgroundId: "PREMIUM_WHITE",
            floorId: "WHITE_STUDIO",
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
      await database.query(
        'INSERT INTO "UsageEvent" ("id", "userId", "type", "quantity", "billingPeriodKey", "idempotencyKey") VALUES ($1, $2, $3, $4, $5, $6)',
        [
          randomUUID(),
          userId,
          "VEHICLE_PROCESSING_BATCH_CREATED",
          1,
          "2026-09",
          "inventory-e2e-upload-session",
        ],
      );

      await page.goto("/dashboard");
      await expect(
        page.getByRole("heading", { name: /Good (morning|afternoon|evening), Inventory\./ }),
      ).toBeVisible();
      const dashboardStatistics = page.getByRole("region", {
        name: "Workspace statistics",
      });
      await expect(dashboardStatistics).toContainText("Vehicles processing");
      await expect(page.getByRole("heading", { name: "2026 Audi Q5" }))
        .toBeVisible();
      await page.screenshot({
        fullPage: true,
        path: testInfo.outputPath("desktop-dashboard.png"),
      });

      await page.setViewportSize({ height: 844, width: 390 });
      await page.goto("/dashboard");
      await expect(page.getByText("Quick actions", { exact: true })).toBeVisible();
      await page.screenshot({
        fullPage: true,
        path: testInfo.outputPath("mobile-dashboard.png"),
      });
      await page.setViewportSize({ height: 720, width: 1280 });

      await page.goto("/settings/billing");
      await expect(page.getByRole("heading", { name: "Usage & Billing" }))
        .toBeVisible();
      // Free is a lifetime allowance of 15 images with no upload-session cap.
      await expect(
        page.getByRole("progressbar", { name: /of 15 images used/ }),
      ).toBeVisible();
      await page.getByRole("button", { name: "Upgrade plan" }).click();
      await expect(page.getByRole("dialog")).toContainText(
        "No payment has been made",
      );
      await page.getByRole("button", { name: "Return to usage" }).click();
      await page.screenshot({
        fullPage: true,
        path: testInfo.outputPath("desktop-usage-billing.png"),
      });

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

      await database.query(
        'UPDATE "ProcessingJob" SET "status" = $1, "completedAt" = $2, "batchRequestHash" = $3, "options" = $4, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $5',
        [
          "COMPLETED",
          new Date("2026-09-20T09:00:00.000Z"),
          "b".repeat(64),
          JSON.stringify({
            backgroundId: "PREMIUM_WHITE",
            floorId: "WHITE_TURNTABLE",
            crop: "MAINTAIN_COMPOSITION",
            enhancement: true,
            outputFormat: "WEBP",
            paddingPercent: 8,
            platePrivacy: true,
            quality: 90,
            shadow: "NATURAL",
          }),
          jobId,
        ],
      );
      await database.query(
        'UPDATE "Vehicle" SET "status" = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $2',
        ["READY", vehicleId],
      );
      await database.query(
        'INSERT INTO "ProcessedAsset" ("id", "userId", "vehicleId", "jobId", "objectKey", "previewObjectKey", "outputFormat", "mimeType", "sizeBytes", "width", "height") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
        [
          randomUUID(),
          userId,
          vehicleId,
          jobId,
          `users/${userId}/vehicles/${vehicleId}/jobs/${jobId}/processed.webp`,
          `users/${userId}/vehicles/${vehicleId}/jobs/${jobId}/preview.webp`,
          "WEBP",
          "image/webp",
          2048,
          1280,
          720,
        ],
      );

      await page.goto(`/inventory/${vehicleId}`);
      await expect(page.getByRole("heading", { name: "2026 Audi Q5" }))
        .toBeVisible();
      await expect(
        page.getByRole("slider", { name: "Compare original and processed image" }),
      ).toBeVisible();
      await expect(page.getByRole("link", { name: "Download image" }))
        .toHaveAttribute("download", "");
      await page.screenshot({
        fullPage: true,
        path: testInfo.outputPath("desktop-vehicle-portfolio.png"),
      });

      // The viewer's close control must be legible, not merely present:
      // near-black text on the near-black viewer passes `toBeVisible`.
      await page.getByRole("button", { name: "Enter full screen" }).click();
      const close = page.getByRole("button", { name: "Close full screen" });
      await expect(close).toBeVisible();
      const textLuminance = await close.evaluate((element) => {
        const channels = getComputedStyle(element).color.match(/\d+/g) ?? [];
        const [red = 0, green = 0, blue = 0] = channels.map(Number);
        return (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
      });
      expect(textLuminance).toBeGreaterThan(0.8);
      await page.screenshot({
        path: testInfo.outputPath("desktop-portfolio-viewer.png"),
      });
      await close.click();
      await expect(close).toHaveCount(0);

      await page.setViewportSize({ height: 844, width: 390 });
      await page.goto(`/inventory/${vehicleId}`);
      await expect(page.getByRole("button", { name: "Enter full screen" }))
        .toBeVisible();
      await page.screenshot({
        fullPage: true,
        path: testInfo.outputPath("mobile-vehicle-portfolio.png"),
      });

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
