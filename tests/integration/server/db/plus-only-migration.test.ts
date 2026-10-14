import { readFileSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
const url = process.env["DATABASE_URL"];
const migration = readFileSync(path.resolve(__dirname, "../../../../apps/web/prisma/migrations/20261008110000_plus_only_contract/migration.sql"), "utf8");
const guard = migration.slice(migration.indexOf("DO $$"), migration.indexOf("END $$;") + "END $$;".length);
(url ? describe : describe.skip)("Plus-only migration production guards", () => {
 let database: Client;
 beforeAll(async () => {
  database = new Client({ connectionString: url }); await database.connect();
  await database.query(`
    CREATE TEMP TABLE "User" ("id" text);
    CREATE TEMP TABLE "AppConfig" ("key" text, "value" jsonb);
    CREATE TEMP TABLE "PlanSubscription" ("id" text);
    CREATE TEMP TABLE "SubscriptionAllowance" ("id" text);
    CREATE TEMP TABLE "CreditAllocation" ("source" text, "allowanceId" text);
    CREATE TEMP TABLE "Payment" ("subscriptionId" text, "planPriceId" text, "razorpaySubscriptionId" text, "billingType" text, "productCode" text);
    CREATE TEMP TABLE "PlanConfig" ("planKey" text, "billingInterval" text, "allowanceScope" text);
  `);
 });
 afterAll(async () => database.end());
 it("allows fresh databases and refuses existing users until old instances have drained", async () => {
  await expect(database.query(guard)).resolves.toBeDefined();
  await database.query('INSERT INTO "User" VALUES ($1)', ["free-customer"]);
  await expect(database.query(guard)).rejects.toThrow(/Drain old/);
  await database.query('INSERT INTO "AppConfig" VALUES ($1, $2)', ["billing.plus-only.rollout-drained", true]);
  await expect(database.query(guard)).resolves.toBeDefined();
 });
 it("refuses to destroy any subscription history", async () => {
  await database.query('INSERT INTO "PlanSubscription" VALUES ($1)', ["historical-subscription"]);
  await expect(database.query(guard)).rejects.toThrow(/Subscription history/);
  const retained = await database.query('SELECT "id" FROM "PlanSubscription"'); expect(retained.rowCount).toBe(1);
  await database.query('DELETE FROM "PlanSubscription"');
 });
 it("refuses to erase historical recurring payment associations", async () => {
  await database.query('INSERT INTO "Payment" ("subscriptionId", "billingType", "productCode") VALUES ($1, $2, $3)', ["sub-history", "MONTHLY", "STUDIO_PRO"]);
  await expect(database.query(guard)).rejects.toThrow(/Subscription history/);
  expect((await database.query('SELECT * FROM "Payment"')).rowCount).toBe(1);
 });
});
