import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { createDatabaseClient } from "../../../../packages/database-runtime/src/client";
import { reconcilePlusOrder } from "../../../../apps/web/src/server/billing/reconcile-plus-order";
const url = process.env["DATABASE_URL"];
(url ? describe : describe.skip)("captured order recovery", () => {
 let database: ReturnType<typeof createDatabaseClient>; let userId: string;
 const suffix = randomUUID().replaceAll("-", "");
 const environment = { APP_ENV: "development", RAZORPAY_KEY_ID: "rzp_test_recovery", RAZORPAY_KEY_SECRET: "secret", RAZORPAY_WEBHOOK_SECRET: "webhook" } satisfies Parameters<typeof reconcilePlusOrder>[1];
 beforeAll(async () => {
  if (!url) throw new Error("Database required"); database = createDatabaseClient({ connectionString: url, log: [] });
  userId = (await database.user.create({ data: { primaryEmail: `${suffix}@recovery.test` } })).id;
    await database.appConfig.upsert({
      where: { key: "billing-business" },
      create: { key: "billing-business", value: {
        businessType: "SOLE_PROPRIETORSHIP", legalProprietorName: "Example Proprietor",
        legalBusinessName: "Example Business", tradingName: "Example Trade",
        productBrandName: "StudioCar AI", businessAddress: "Example address",
        billingEmail: "billing@example.test", supportEmail: "support@example.test",
        gstRegistered: false, gstin: null,
      } },
      update: { value: {
        businessType: "SOLE_PROPRIETORSHIP", legalProprietorName: "Example Proprietor",
        legalBusinessName: "Example Business", tradingName: "Example Trade",
        productBrandName: "StudioCar AI", businessAddress: "Example address",
        billingEmail: "billing@example.test", supportEmail: "support@example.test",
        gstRegistered: false, gstin: null,
      } },
    });
 });
 afterEach(() => vi.unstubAllGlobals());
 afterAll(async () => {
  const payments = await database.payment.findMany({ where: { userId }, select: { id: true } });
  await database.auditLog.deleteMany({ where: { resourceId: { in: payments.map((payment) => payment.id) } } });
  await database.receipt.deleteMany({ where: { userId } }); await database.creditLedger.deleteMany({ where: { userId } });
  await database.payment.deleteMany({ where: { userId } }); await database.user.delete({ where: { id: userId } }); await database.$disconnect();
 });
 it("recovers an unassociated captured order once and is safe to repeat", async () => {
  const local = await database.payment.create({ data: { userId, productCode: "STUDIO_PLUS", billingType: "ONE_TIME", amountPaise: 199900, currency: "INR", includedImages: 100 } });
  const orderId = `order_${suffix}`;
  vi.stubGlobal("fetch", vi.fn().mockImplementation((url: string) => Promise.resolve(new Response(JSON.stringify(url.endsWith("/payments") ? {
    items: [{ id: `pay_${suffix}`, order_id: orderId, amount: 199900, currency: "INR", status: "captured", created_at: 1 }],
  } : { id: orderId, amount: 199900, currency: "INR", receipt: local.id }), { status: 200 }))));
  await expect(reconcilePlusOrder(database, environment, orderId)).resolves.toBe(1);
  await reconcilePlusOrder(database, environment, orderId);
  expect(await database.creditLedger.count({ where: { userId } })).toBe(1);
  expect(await database.receipt.count({ where: { userId } })).toBe(1);
 });
 it("never grants credits for provider payments that are merely authorized", async () => {
  const local = await database.payment.create({ data: { userId, productCode: "STUDIO_PLUS", billingType: "ONE_TIME", amountPaise: 199900, currency: "INR", includedImages: 100 } });
  const orderId = `order_authorized${suffix}`;
  vi.stubGlobal("fetch", vi.fn().mockImplementation((url: string) => Promise.resolve(new Response(JSON.stringify(url.endsWith("/payments") ? {
    items: [{ id: `pay_authorized${suffix}`, order_id: orderId, amount: 199900, currency: "INR", status: "authorized", created_at: 1 }],
  } : { id: orderId, amount: 199900, currency: "INR", receipt: local.id }), { status: 200 }))));
  await expect(reconcilePlusOrder(database, environment, orderId)).resolves.toBe(0);
  expect(await database.creditLedger.count({ where: { referenceId: local.id } })).toBe(0);
 });
});
