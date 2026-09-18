import { expect, test } from "@playwright/test";

test("renders the design-system foundation", async ({ page }, testInfo) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "StudioCar AI" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Primary action" })).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "Upload progress" })).toHaveAttribute(
    "aria-valuenow",
    "65",
  );
  await page.screenshot({ fullPage: true, path: testInfo.outputPath("design-foundation.png") });
});
