import { expect, test } from "@playwright/test";

test("renders the complete marketing homepage at desktop and mobile widths", async ({
  page,
}, testInfo) => {
  const response = await page.goto("/");
  if (!response) throw new Error("Expected the homepage response.");
  const responseHeaders = response.headers();

  expect(responseHeaders["content-security-policy"]).toContain(
    "frame-ancestors 'none'",
  );
  expect(responseHeaders["strict-transport-security"]).toBe(
    "max-age=63072000; includeSubDomains; preload",
  );
  expect(responseHeaders["x-content-type-options"]).toBe("nosniff");
  expect(responseHeaders["x-frame-options"]).toBe("DENY");

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
