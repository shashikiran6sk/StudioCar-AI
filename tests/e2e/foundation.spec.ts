import { expect, test } from "@playwright/test";

test("renders the complete marketing homepage at desktop and mobile widths", async ({
  page,
}, testInfo) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /Turn every vehicle photo/ }))
    .toBeVisible();
  await expect(
    page.getByRole("slider", { name: "Compare original and studio processed vehicle" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: /complete portfolio in four steps/ }))
    .toBeVisible();
  await expect(page.getByRole("heading", { name: /Start free. Add capacity/ }))
    .toBeVisible();
  await page.screenshot({ fullPage: true, path: testInfo.outputPath("desktop-homepage.png") });

  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto("/");
  await expect(
    page.getByRole("navigation", { name: "Product", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("banner").getByRole("link", { name: "Start free" }),
  ).toBeVisible();
  await page.screenshot({ fullPage: true, path: testInfo.outputPath("mobile-homepage.png") });
});
