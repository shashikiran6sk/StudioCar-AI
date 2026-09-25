import { expect, test } from "@playwright/test";
import { unzipSync } from "fflate";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Pool } from "pg";

import { hashSessionToken } from "../../apps/web/src/server/auth/session-service";
import { LOCAL_INFRASTRUCTURE } from "../../packages/config/src/local-infrastructure";

const databaseUrl = process.env["DATABASE_URL"];
const inventoryTest = databaseUrl ? test : test.skip;
const SESSION_TOKEN = "i".repeat(43);
const INVENTORY_EMAIL = "inventory-e2e@studiocar.test";
const SESSION_COOKIE_NAME = "__Host-studiocar_session";
const SESSION_COOKIE_SCOPE_URL = "https://localhost:3100";
// The browser suite runs under APP_ENV=local, so signed links address the
// Local profile's MinIO bucket; they are intercepted before any request leaves.
const PRIVATE_S3_ROUTE = `${LOCAL_INFRASTRUCTURE.storageEndpoint}/**`;
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
          // The deployed bucket's CORS rule allows GET for the ZIP download.
          headers: { "access-control-allow-origin": "*" },
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

      await page.getByRole("button", { name: /Upload Vehicle/ }).first().click();
      const vehicleDialog = page.getByRole("dialog");
      await expect(vehicleDialog.getByText("Vehicle", { exact: true })).toBeVisible();
      await expect(vehicleDialog.getByText("Photos", { exact: true })).toBeVisible();
      await expect(vehicleDialog.getByText("Studio", { exact: true })).toBeVisible();
      await expect(vehicleDialog.getByText("Review", { exact: true })).toBeVisible();
      await expect(vehicleDialog.getByRole("textbox", { name: /internal id/i }))
        .toHaveCount(0);
      await vehicleDialog.getByText("Add vehicle specifications (optional)").click();
      await expect(vehicleDialog.getByRole("textbox", { name: "Brand" })).toBeVisible();
      await vehicleDialog.getByText("Add vehicle specifications (optional)").click();
      await expect(vehicleDialog.getByRole("textbox", { name: "Brand" })).toBeHidden();
      await vehicleDialog.getByRole("textbox", { name: /vehicle name/i })
        .fill("2025 Porsche 911 Carrera");
      await page.screenshot({
        path: testInfo.outputPath("simplified-vehicle-details.png"),
      });
      await vehicleDialog.getByRole("button", { name: "Continue to photos" }).click();
      await expect(vehicleDialog.getByText("Upload photos", { exact: true })).toBeVisible();
      await vehicleDialog.getByRole("button", { name: "Close dialog" }).click();
      await database.query('DELETE FROM "Vehicle" WHERE "userId" = $1 AND "name" = $2', [
        userId,
        "2025 Porsche 911 Carrera",
      ]);

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

      const searchVehicleId = randomUUID();
      await database.query(
        'INSERT INTO "Vehicle" ("id", "userId", "name", "status", "updatedAt") VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)',
        [searchVehicleId, userId, "2025 Porsche 911 Carrera", "READY"],
      );
      await page.goto("/inventory");
      const searchInput = page.getByRole("searchbox", {
        name: "Search vehicles by name or reference",
      });
      const matchingResponse = page.waitForResponse((response) =>
        response.url().includes("/api/inventory/search?q=porsche") && response.status() === 200,
      );
      await searchInput.fill("porsche");
      await matchingResponse;
      await expect(page.getByRole("heading", { name: "2025 Porsche 911 Carrera" }))
        .toBeVisible();
      await expect(page.getByRole("heading", { name: "2026 Audi Q5" })).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Apply" })).toHaveCount(0);
      await page.screenshot({
        fullPage: true,
        path: testInfo.outputPath("desktop-inventory-search.png"),
      });
      await page.getByRole("link", { name: /Completed/ }).click();
      await expect(page.getByRole("heading", { name: "2025 Porsche 911 Carrera" }))
        .toBeVisible();
      await expect(page.getByRole("searchbox")).toHaveValue("porsche");
      await page.getByRole("link", { name: /All/ }).click();
      await expect(page.getByRole("link", { name: /All/ })).toHaveAttribute("aria-current", "page");
      await expect(page.getByRole("heading", { name: "2025 Porsche 911 Carrera" })).toBeVisible();
      const emptyResponse = page.waitForResponse((response) =>
        response.url().includes("/api/inventory/search?q=nonexistent") && response.status() === 200,
      );
      await page.getByRole("searchbox").fill("nonexistent");
      await emptyResponse;
      await expect(page.getByRole("heading", { name: "No vehicles found for 'nonexistent'" }))
        .toBeVisible();
      await page.screenshot({
        fullPage: true,
        path: testInfo.outputPath("desktop-inventory-search-empty.png"),
      });
      await page.getByRole("button", { name: "Clear search" }).first().click();
      await expect(page.getByRole("heading", { name: "2025 Porsche 911 Carrera" }))
        .toBeVisible();
      await expect(page.getByRole("heading", { name: "2026 Audi Q5" })).toBeVisible();
      await database.query('DELETE FROM "Vehicle" WHERE "id" = $1', [searchVehicleId]);

      await database.query(
        'UPDATE "ProcessingJob" SET "status" = $1, "completedAt" = $2, "batchRequestHash" = $3, "options" = $4, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $5',
        [
          "COMPLETED",
          new Date("2026-09-20T09:00:00.000Z"),
          "b".repeat(64),
          JSON.stringify({
            background: "PREMIUM_WHITE",
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

      // Every image of the version downloads as one ZIP built in the browser.
      const zipDownload = page.waitForEvent("download");
      await page.getByRole("button", { name: "Download all (ZIP)" }).click();
      const zip = await zipDownload;
      expect(zip.suggestedFilename()).toBe("2026-audi-q5-studio-images.zip");
      const zipPath = await zip.path();
      const zipEntries = unzipSync(new Uint8Array(await readFile(zipPath)));
      expect(Object.keys(zipEntries)).toEqual(["processed-01.webp"]);
      expect(new TextDecoder().decode(zipEntries["processed-01.webp"])).toContain("<svg");

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

      // Nothing needs attention, so the third quick action creates another
      // studio version by choosing a vehicle in Inventory.
      await page.goto("/dashboard");
      await expect(
        page.getByRole("heading", { name: "Create studio images" }),
      ).toBeVisible();
      await page.getByRole("link", { name: "Create images →" }).click();
      await expect(page).toHaveURL(/\/inventory\?mode=CREATE_STUDIO$/);
      await expect(
        page.getByRole("heading", { name: "Choose a vehicle", level: 1 }),
      ).toBeVisible();
      await page.screenshot({
        path: testInfo.outputPath("desktop-create-studio-inventory.png"),
      });
      // A short window forces the dialog to scroll; its actions must stay
      // on screen rather than being pushed below the fold.
      await page.setViewportSize({ height: 420, width: 1280 });
      await page.getByRole("link", { name: /Create images/ }).click();
      const variantDialog = page.getByRole("dialog", { name: "Choose photos" });
      await expect(variantDialog).toBeVisible();
      await expect(
        variantDialog.getByRole("button", { name: "Continue to customize →" }),
      ).toBeInViewport();
      await expect(variantDialog.getByRole("button", { name: "Cancel" })).toBeInViewport();
      await page.screenshot({
        animations: "disabled",
        path: testInfo.outputPath("short-window-create-studio-dialog.png"),
      });
      await page.setViewportSize({ height: 720, width: 1280 });
      await expect(variantDialog).toContainText("New studio version");
      await expect(
        variantDialog.getByRole("checkbox", { name: "Include source.jpg" }),
      ).toBeChecked();
      await page.screenshot({
        animations: "disabled",
        path: testInfo.outputPath("desktop-create-studio-dialog.png"),
      });
      await variantDialog.getByRole("button", { name: "Cancel" }).click();
      await expect(page).toHaveURL(/\/inventory\?mode=CREATE_STUDIO$/);
      await expect(variantDialog).toHaveCount(0);

      // A newer batch then fails terminally: one vehicle needs attention, so
      // the dashboard leads straight to its portfolio.
      const failedJobId = randomUUID();
      await database.query(
        'INSERT INTO "ProcessingJob" ("id", "userId", "vehicleId", "imageAssetId", "status", "provider", "options", "idempotencyKey", "batchIdempotencyKey", "errorCode", "failedAt", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
        [
          failedJobId,
          userId,
          vehicleId,
          imageAssetId,
          "FAILED",
          "REMOVEBG",
          JSON.stringify({ background: "DARK_STUDIO", floor: "PLAIN" }),
          "inventory-e2e-failed-job",
          "inventory-e2e-failed-batch",
          "PROVIDER_TIMEOUT",
        ],
      );
      await database.query(
        'UPDATE "Vehicle" SET "status" = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $2',
        ["PARTIALLY_FAILED", vehicleId],
      );
      await page.goto("/dashboard");
      await expect(page.getByRole("heading", { name: "Attention needed" }))
        .toBeVisible();
      await expect(page.getByText("1 vehicle needs your attention.")).toBeVisible();
      // The recent-vehicle card offers the same review; use the quick action.
      await page
        .locator(".dashboard-actions")
        .getByRole("link", { name: "Review issues →" })
        .click();
      await expect(page).toHaveURL(new RegExp(`/inventory/${vehicleId}#attention$`));
      const attention = page.getByRole("region", { name: "Needs your attention" });
      await expect(attention).toBeFocused();
      await expect(attention).toContainText("1 of 1 image needs attention");
      await expect(attention).toContainText("Dark Studio · Plain background");
      await expect(attention).not.toContainText("PROVIDER_TIMEOUT");
      // The completed version stays visible beside the failure.
      await expect(
        page.getByRole("slider", { name: "Compare original and processed image" }),
      ).toBeVisible();
      await page.screenshot({
        fullPage: true,
        path: testInfo.outputPath("desktop-portfolio-attention.png"),
      });

      await attention.getByRole("link", { name: "Re-process" }).click();
      const reprocessDialog = page.getByRole("dialog", { name: "Choose photos" });
      await expect(reprocessDialog).toContainText("Re-process failed images");
      await expect(
        reprocessDialog.getByRole("checkbox", { name: "Include source.jpg" }),
      ).toBeChecked();
      await expect(reprocessDialog).toContainText("Processing failed");
      await reprocessDialog
        .getByRole("button", { name: "Continue to customize →" })
        .click();
      const customizeDialog = page.getByRole("dialog", {
        name: "Customize treatment",
      });
      await expect(
        customizeDialog.getByRole("button", { name: "Dark Studio" }),
      ).toHaveAttribute("aria-pressed", "true");
      await expect(
        customizeDialog.getByRole("button", { name: "Plain background" }),
      ).toHaveAttribute("aria-pressed", "true");
      await page.screenshot({
        animations: "disabled",
        path: testInfo.outputPath("desktop-reprocess-dialog.png"),
      });
      await customizeDialog.getByRole("button", { name: "Close dialog" }).click();
      await expect(page).toHaveURL(new RegExp(`/inventory/${vehicleId}$`));

      await page.goto("/inventory?filter=NEEDS_ATTENTION");
      await expect(page.getByRole("link", { name: /Review issues/ })).toHaveAttribute(
        "href",
        `/inventory/${vehicleId}#attention`,
      );
      await database.query(
        'UPDATE "Vehicle" SET "status" = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $2',
        ["READY", vehicleId],
      );
      await database.query('DELETE FROM "ProcessingJob" WHERE "id" = $1', [
        failedJobId,
      ]);

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
        page.getByRole("heading", { name: "No vehicles found for 'BMW'" }),
      ).toBeVisible();
      await expect(page.getByRole("searchbox", { name: "Search vehicles by name or reference" }))
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
