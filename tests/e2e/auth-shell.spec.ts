import { expect, test } from "@playwright/test";

test("redirects an unauthenticated workspace request to sign in", async ({
  page,
}, testInfo) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("heading", { name: "Sign in to StudioCar AI" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Continue with Google" }),
  ).toHaveAttribute("href", "/api/auth/google/start?returnTo=%2Fdashboard");
  await expect(
    page.getByRole("button", { name: "Continue with phone" }),
  ).toBeVisible();
  await page.screenshot({
    fullPage: true,
    path: testInfo.outputPath("desktop-sign-in.png"),
  });
});

test("keeps the sign-in controls usable on a mobile viewport", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto("/login");

  await expect(page.getByLabel("Phone number")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue with phone" }),
  ).toBeVisible();
  await page.screenshot({
    fullPage: true,
    path: testInfo.outputPath("mobile-sign-in.png"),
  });
});
