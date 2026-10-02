import { expect, test, type Locator, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";

import { hashSessionToken } from "../../apps/web/src/server/auth/session-service";

const databaseUrl = process.env["DATABASE_URL"];
const mobileTest = databaseUrl ? test : test.skip;
const SESSION_TOKEN = "m".repeat(43);
const MOBILE_EMAIL = "mobile-navigation-e2e@studiocar.test";
const SESSION_COOKIE_NAME = "__Host-studiocar_session";
const SESSION_COOKIE_SCOPE_URL = "https://localhost:3100";
const MOBILE_VIEWPORT = { height: 844, width: 390 };
const NARROWEST_VIEWPORT = { height: 640, width: 320 };
const DESKTOP_VIEWPORT = { height: 960, width: 1440 };
const PAGES = ["/", "/dashboard", "/inventory", "/settings/billing", "/settings/profile"];

/** Waits for the drawer to finish sliding in, as a person would. */
async function settle(drawer: Locator): Promise<void> {
  await drawer.evaluate((element) =>
    Promise.all(element.getAnimations().map((animation) => animation.finished)),
  );
}

async function hasHorizontalOverflow(page: Page): Promise<boolean> {
  return page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
}

mobileTest(
  "replaces the sidebar with a navigation drawer on narrow screens",
  async ({ page }, testInfo) => {
    if (!databaseUrl) throw new Error("DATABASE_URL is required for this test.");
    const database = new Pool({ connectionString: databaseUrl, max: 1 });

    try {
      await database.query('DELETE FROM "User" WHERE "primaryEmail" = $1', [
        MOBILE_EMAIL,
      ]);
      const userId = randomUUID();
      await database.query(
        'INSERT INTO "User" ("id", "displayName", "primaryEmail", "updatedAt") VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
        [userId, "Mobile Test User", MOBILE_EMAIL],
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

      await page.setViewportSize(MOBILE_VIEWPORT);
      await page.goto("/dashboard");

      // The desktop sidebar is gone; the top bar names the current section.
      await expect(page.locator(".app-sidebar")).toBeHidden();
      const topbar = page.locator(".app-topbar");
      await expect(topbar.getByText("Dashboard", { exact: true })).toBeVisible();

      const menu = page.getByRole("button", { name: "Open navigation" });
      await menu.click();
      const drawer = page.getByRole("dialog", { name: "Workspace navigation" });
      await expect(drawer).toBeVisible();
      const navigation = drawer.getByRole("navigation", { name: "Workspace" });
      await expect(navigation.getByRole("link")).toHaveCount(4);
      await expect(
        navigation.getByRole("link", { name: /Dashboard/ }),
      ).toHaveAttribute("aria-current", "page");
      await expect(navigation.getByRole("link", { name: /Profile/ })).toBeVisible();
      await expect(drawer.getByRole("button", { name: "Log out" })).toBeVisible();
      await expect(
        drawer.getByRole("progressbar", { name: /images used/ }),
      ).toBeVisible();

      // Once it has slid in, the drawer lies inside the viewport and the page
      // behind cannot scroll.
      await settle(drawer);
      const box = await drawer.boundingBox();
      expect(box).not.toBeNull();
      expect(box?.x).toBe(0);
      expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(
        MOBILE_VIEWPORT.width,
      );
      expect(box?.height).toBe(MOBILE_VIEWPORT.height);
      await page.mouse.wheel(0, 600);
      expect(await page.evaluate(() => window.scrollY)).toBe(0);
      await page.screenshot({
        path: testInfo.outputPath("mobile-navigation-drawer.png"),
      });

      await page.keyboard.press("Escape");
      await expect(drawer).toHaveCount(0);
      await expect(menu).toBeFocused();

      // Tapping the backdrop beside the drawer closes it.
      await menu.click();
      await expect(drawer).toBeVisible();
      await settle(drawer);
      await page.mouse.click(MOBILE_VIEWPORT.width - 20, MOBILE_VIEWPORT.height / 2);
      await expect(drawer).toHaveCount(0);

      // Choosing a destination navigates and closes the drawer.
      await menu.click();
      await drawer.getByRole("link", { name: /Inventory/ }).click();
      await expect(page).toHaveURL(/\/inventory$/);
      await expect(drawer).toHaveCount(0);
      await expect(topbar.getByText("Inventory", { exact: true })).toBeVisible();

      for (const viewport of [NARROWEST_VIEWPORT, MOBILE_VIEWPORT]) {
        await page.setViewportSize(viewport);
        for (const path of PAGES) {
          await page.goto(path);
          expect(
            await hasHorizontalOverflow(page),
            `${path} at ${String(viewport.width)}px`,
          ).toBe(false);
        }
      }

      // The desktop shell is unchanged: a sidebar, and no menu control.
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto("/dashboard");
      await expect(page.locator(".app-sidebar")).toBeVisible();
      await expect(menu).toBeHidden();
    } finally {
      await database.query('DELETE FROM "User" WHERE "primaryEmail" = $1', [
        MOBILE_EMAIL,
      ]);
      await database.end();
    }
  },
);
