import { expect, test } from "@playwright/test";
import { Pool, type QueryResultRow } from "pg";

const databaseUrl = process.env["DATABASE_URL"];
const phoneTest = databaseUrl ? test : test.skip;
const PHONE = "+918765430102";
const DEV_CODE = "1234";

interface AccountCountRow extends QueryResultRow {
  count: string;
}

phoneTest("verifies a new phone, creates one account, then signs into it", async ({ page }, testInfo) => {
  if (!databaseUrl) throw new Error("DATABASE_URL is required.");
  const database = new Pool({ connectionString: databaseUrl, max: 1 });

  async function verifyPhone(): Promise<void> {
    await page.goto("/login");
    await page.getByRole("textbox", { name: "Phone number" }).fill(PHONE);
    await page.getByRole("button", { name: "Continue with phone" }).click();
    await page.getByRole("textbox", { name: "Verification code" }).fill(DEV_CODE);
    await page.getByRole("button", { name: "Verify and continue" }).click();
  }

  try {
    await database.query('DELETE FROM "PhoneOtpChallenge" WHERE "phoneNumber" = $1', [PHONE]);
    await database.query('DELETE FROM "User" WHERE "primaryPhone" = $1', [PHONE]);

    await verifyPhone();
    await expect(page.getByRole("link", { name: "Link with Google" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Create new account" })).toBeVisible();
    await page.screenshot({
      fullPage: true,
      path: testInfo.outputPath("verified-phone-choices.png"),
    });
    await page.getByRole("button", { name: "Create new account" }).click();
    await page.getByRole("textbox", { name: "Name" }).fill("Phone Flow Customer");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    const created = await database.query<AccountCountRow>(
      'SELECT COUNT(*) AS "count" FROM "User" WHERE "primaryPhone" = $1',
      [PHONE],
    );
    expect(created.rows[0]?.count).toBe("1");

    await page.context().clearCookies();
    await verifyPhone();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("button", { name: "Create new account" })).toHaveCount(0);
    const afterSignIn = await database.query<AccountCountRow>(
      'SELECT COUNT(*) AS "count" FROM "User" WHERE "primaryPhone" = $1',
      [PHONE],
    );
    expect(afterSignIn.rows[0]?.count).toBe("1");
  } finally {
    await database.query('DELETE FROM "PhoneOtpChallenge" WHERE "phoneNumber" = $1', [PHONE]);
    await database.query('DELETE FROM "User" WHERE "primaryPhone" = $1', [PHONE]);
    await database.end();
  }
});

phoneTest("keeps a wrong code on the code step as an incorrect code, not an outage", async ({ page }, testInfo) => {
  if (!databaseUrl) throw new Error("DATABASE_URL is required.");
  const database = new Pool({ connectionString: databaseUrl, max: 1 });
  const phone = "+918765430103";

  try {
    await database.query('DELETE FROM "PhoneOtpChallenge" WHERE "phoneNumber" = $1', [phone]);
    await page.goto("/login");
    await page.getByRole("textbox", { name: "Phone number" }).fill(phone);
    await page.getByRole("button", { name: "Continue with phone" }).click();

    await expect(page.getByRole("heading", { name: "Enter verification code" })).toBeVisible();
    await expect(page.getByText("+91 ******0103")).toBeVisible();
    await expect(page.getByRole("button", { name: /Resend code in \d+s/ })).toBeDisabled();

    const code = page.getByRole("textbox", { name: "Verification code" });
    await code.fill("9999");
    await page.getByRole("button", { name: "Verify and continue" }).click();

    await expect(
      page.getByText("The verification code you entered is incorrect. Please try again."),
    ).toBeVisible();
    await expect(page.getByText(/not available/)).toHaveCount(0);
    await expect(code).toHaveValue("");
    await expect(code).toBeFocused();
    await page.screenshot({
      fullPage: true,
      path: testInfo.outputPath("incorrect-code.png"),
    });

    await code.fill(DEV_CODE);
    await page.getByRole("button", { name: "Verify and continue" }).click();
    await expect(page.getByRole("button", { name: "Create new account" })).toBeVisible();
  } finally {
    await database.query('DELETE FROM "PhoneOtpChallenge" WHERE "phoneNumber" = $1', [phone]);
    await database.query('DELETE FROM "User" WHERE "primaryPhone" = $1', [phone]);
    await database.end();
  }
});
