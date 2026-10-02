import { createHmac, randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { createDatabaseClient } from "../../../../packages/database-runtime/src/client";
import { BillingService } from "../../../../apps/web/src/server/billing/billing-service";

const databaseUrl = process.env["DATABASE_URL"];
const databaseDescribe = databaseUrl ? describe : describe.skip;

databaseDescribe("BillingService", () => {
  let database: ReturnType<typeof createDatabaseClient>;
  let service: BillingService;
  let userId: string;
  const suffix = randomUUID().replaceAll("-", "");

  beforeAll(async () => {
    if (!databaseUrl) throw new Error("DATABASE_URL is required.");
    database = createDatabaseClient({ connectionString: databaseUrl, log: [] });
    userId = (await database.user.create({ data: { primaryEmail: `service-${suffix}@example.test` } })).id;
    await database.appConfig.upsert({
      where: { key: "billing-business" },
      create: { key: "billing-business", value: {
        businessType: "SOLE_PROPRIETORSHIP", legalProprietorName: "Example Proprietor", legalBusinessName: "Example Business",
        tradingName: "Example Trade", productBrandName: "StudioCar AI", businessAddress: "Example Address",
        billingEmail: "billing@example.test", supportEmail: "support@example.test", gstRegistered: false, gstin: null,
      } },
      update: { value: {
        businessType: "SOLE_PROPRIETORSHIP", legalProprietorName: "Example Proprietor", legalBusinessName: "Example Business",
        tradingName: "Example Trade", productBrandName: "StudioCar AI", businessAddress: "Example Address",
        billingEmail: "billing@example.test", supportEmail: "support@example.test", gstRegistered: false, gstin: null,
      } },
    });
    await database.planConfig.upsert({
      where: { planKey: "STUDIO_PLUS" },
      create: { planKey: "STUDIO_PLUS", displayName: "Studio Plus", description: "Credits", segment: "Popular",
        active: true, purchasable: true, featured: true, priceMinorUnits: 199900, currency: "INR", billingInterval: "ONE_TIME",
        allowanceScope: "LIFETIME", includedImages: 100, maxImagesPerBatch: 20, features: ["100 credits"], displayOrder: 1 },
      update: { active: true, purchasable: true, priceMinorUnits: 199900, includedImages: 100 },
    });
    const pro = await database.planConfig.upsert({
      where: { planKey: "STUDIO_PRO" },
      create: { planKey: "STUDIO_PRO", displayName: "Studio Pro", description: "Monthly", segment: "Teams",
        active: true, purchasable: true, featured: false, priceMinorUnits: 549900, currency: "INR", billingInterval: "MONTHLY",
        allowanceScope: "BILLING_PERIOD", includedImages: 400, maxImagesPerBatch: 20, features: ["400 images"], displayOrder: 2 },
      update: { active: true, purchasable: true, priceMinorUnits: 549900, includedImages: 400 },
    });
    await database.planPrice.create({
      data: { planConfigId: pro.id, environment: "development", priceMinorUnits: 549900, currency: "INR",
        includedImages: 400, razorpayPlanId: `plan_${suffix}` },
    });
    service = new BillingService(database, {
      APP_ENV: "development", RAZORPAY_KEY_ID: "rzp_test_fixture", RAZORPAY_KEY_SECRET: "secret", RAZORPAY_WEBHOOK_SECRET: "webhook",
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  afterAll(async () => {
    if (!database) return;
    await database.payment.deleteMany({ where: { userId } });
    await database.planSubscription.deleteMany({ where: { userId } });
    await database.planPrice.deleteMany({ where: { razorpayPlanId: `plan_${suffix}` } });
    await database.user.delete({ where: { id: userId } });
    await database.$disconnect();
  });

  it("gets the Plus amount from the database and verifies without granting credits", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: `order_${suffix}` }), { status: 200 })));
    const order = await service.createOrder(userId);
    expect(order).toMatchObject({ amount: 199900, currency: "INR", keyId: "rzp_test_fixture" });
    const signature = createHmac("sha256", "secret").update(`${order.orderId}|pay_${suffix}`).digest("hex");
    expect(await service.verifyOrder(userId, {
      razorpay_order_id: order.orderId, razorpay_payment_id: `pay_${suffix}`, razorpay_signature: signature,
    })).toBe(true);
    expect(await service.verifyOrder(userId, {
      razorpay_order_id: order.orderId, razorpay_payment_id: `pay_${suffix}`, razorpay_signature: "0".repeat(64),
    })).toBe(false);
    expect(await database.creditLedger.count({ where: { userId } })).toBe(0);
    expect(await database.receipt.count({ where: { userId } })).toBe(0);
  });

  it("reuses one pending Pro subscription and cancels it at period end", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.endsWith("/cancel")) return Promise.resolve(new Response(JSON.stringify({ status: "active" }), { status: 200 }));
      return Promise.resolve(new Response(JSON.stringify({ id: `sub_${suffix}`, plan_id: `plan_${suffix}` }), { status: 200 }));
    });
    vi.stubGlobal("fetch", fetchMock);
    const first = await service.createSubscription(userId);
    const second = await service.createSubscription(userId);
    expect(first.subscriptionId).toBe(second.subscriptionId);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const signature = createHmac("sha256", "secret").update(`pay_${suffix}|sub_${suffix}`).digest("hex");
    expect(await service.verifySubscription(userId, {
      razorpay_subscription_id: `sub_${suffix}`, razorpay_payment_id: `pay_${suffix}`, razorpay_signature: signature,
    })).toBe(true);
    await database.planSubscription.update({ where: { providerSubscriptionId: `sub_${suffix}` }, data: { status: "ACTIVE" } });
    expect(await service.cancelSubscription(userId)).toBe(true);
    expect((await database.planSubscription.findUniqueOrThrow({ where: { providerSubscriptionId: `sub_${suffix}` } })).cancelAtPeriodEnd).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
