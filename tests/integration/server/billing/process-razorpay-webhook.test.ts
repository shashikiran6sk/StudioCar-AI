import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { RazorpayWebhookSchema } from "../../../../packages/contracts/src/billing";
import { createDatabaseClient } from "../../../../packages/database-runtime/src/client";
import { processRazorpayWebhook } from "../../../../apps/web/src/server/billing/process-razorpay-webhook";

const databaseUrl = process.env["DATABASE_URL"];
const databaseDescribe = databaseUrl ? describe : describe.skip;

databaseDescribe("Razorpay webhook effects", () => {
  let database: ReturnType<typeof createDatabaseClient>;
  const suffix = randomUUID().replaceAll("-", "");
  let userId: string;

  beforeAll(async () => {
    if (!databaseUrl) throw new Error("DATABASE_URL is required.");
    database = createDatabaseClient({ connectionString: databaseUrl, log: [] });
    const user = await database.user.create({ data: { primaryEmail: `billing-${suffix}@example.test`, displayName: "Billing Customer" } });
    userId = user.id;
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

  afterAll(async () => {
    if (!database) return;
    const paymentIds = (await database.payment.findMany({ where: { userId }, select: { id: true } })).map((payment) => payment.id);
    await database.webhookEvent.deleteMany({ where: { externalId: { contains: suffix } } });
    await database.auditLog.deleteMany({ where: { resourceType: "Payment", resourceId: { in: paymentIds } } });
    await database.receipt.deleteMany({ where: { userId } });
    await database.subscriptionAllowance.deleteMany({ where: { userId } });
    await database.creditLedger.deleteMany({ where: { userId } });
    await database.billingRefund.deleteMany({ where: { payment: { userId } } });
    await database.payment.deleteMany({ where: { userId } });
    await database.planSubscription.deleteMany({ where: { userId } });
    await database.planPrice.deleteMany({ where: { planConfig: { planKey: `TEST_PRO_${suffix}` } } });
    await database.planConfig.deleteMany({ where: { planKey: `TEST_PRO_${suffix}` } });
    await database.user.delete({ where: { id: userId } });
    await database.$disconnect();
  });

  it("grants exactly one Plus purchase and receipt for duplicate captured events", async () => {
    const orderId = `order_${suffix}`;
    const paymentId = `pay_${suffix}`;
    const payment = await database.payment.create({
      data: { userId, productCode: "STUDIO_PLUS", billingType: "ONE_TIME", razorpayOrderId: orderId, amountPaise: 199900, currency: "INR", includedImages: 100 },
    });
    const event = RazorpayWebhookSchema.parse({
      event: "payment.captured",
      payload: { payment: { entity: { id: paymentId, amount: 199900, currency: "INR", status: "captured", order_id: orderId, method: "upi", created_at: 1790294400 } } },
    });
    await processRazorpayWebhook(database, `event_plus_${suffix}`, event);
    await processRazorpayWebhook(database, `event_plus_${suffix}`, event);
    await processRazorpayWebhook(database, `event_plus_retry_${suffix}`, event);
    expect(await database.creditLedger.count({ where: { userId, type: "PURCHASE_GRANT" } })).toBe(1);
    expect(await database.creditLedger.aggregate({ where: { userId }, _sum: { amount: true } })).toMatchObject({ _sum: { amount: 100 } });
    expect(await database.receipt.count({ where: { paymentId: payment.id } })).toBe(1);
    expect((await database.payment.findUniqueOrThrow({ where: { id: payment.id } })).status).toBe("PAID");
  });

  it("creates one allowance and receipt per unique Pro charge, without rollover", async () => {
    const plan = await database.planConfig.create({
      data: {
        planKey: `TEST_PRO_${suffix}`, displayName: "Test Pro", description: "Test", segment: "Test",
        active: true, purchasable: true, featured: false, priceMinorUnits: 549900,
        currency: "INR", billingInterval: "MONTHLY", allowanceScope: "BILLING_PERIOD",
        includedImages: 400, maxImagesPerBatch: 20, storageBytes: null,
        features: ["400 images"], displayOrder: 99,
      },
    });
    const price = await database.planPrice.create({
      data: { planConfigId: plan.id, environment: "development", priceMinorUnits: 549900, currency: "INR", includedImages: 400, razorpayPlanId: `plan_${suffix}` },
    });
    const subscription = await database.planSubscription.create({
      data: {
        userId, source: "PAYMENT_PROVIDER", provider: "RAZORPAY", providerSubscriptionId: `sub_${suffix}`,
        razorpayPlanId: price.razorpayPlanId, planPriceId: price.id,
        planKey: "STUDIO_PRO", status: "CREATED",
        currentPeriodStart: new Date("2026-09-01T00:00:00Z"), currentPeriodEnd: new Date("2026-10-01T00:00:00Z"),
      },
    });
    const periods = [
      { start: 1790294400, end: 1792886400, paymentId: `pay_profirst${suffix}` },
      { start: 1792886400, end: 1795564800, paymentId: `pay_pronext${suffix}` },
    ];
    for (const [index, period] of periods.entries()) {
      const event = RazorpayWebhookSchema.parse({
        event: "subscription.charged",
        payload: {
          subscription: { entity: { id: `sub_${suffix}`, plan_id: price.razorpayPlanId, status: "active", current_start: period.start, current_end: period.end } },
          payment: { entity: { id: period.paymentId, amount: 549900, currency: "INR", status: "captured", created_at: period.start } },
        },
      });
      await processRazorpayWebhook(database, `event_pro_${String(index)}_${suffix}`, event);
      await processRazorpayWebhook(database, `event_pro_retry_${String(index)}_${suffix}`, event);
    }
    const allowances = await database.subscriptionAllowance.findMany({ where: { subscriptionId: subscription.id }, orderBy: { periodStart: "asc" } });
    expect(allowances).toHaveLength(2);
    expect(allowances.map((allowance) => [allowance.allowance, allowance.consumed])).toEqual([[400, 0], [400, 0]]);
    expect(await database.payment.count({ where: { subscriptionId: subscription.id } })).toBe(2);
    expect(await database.receipt.count({ where: { userId, productCode: "STUDIO_PRO_MONTHLY" } })).toBe(2);

    for (const [index, state] of ["pending", "halted", "cancelled"].entries()) {
      await processRazorpayWebhook(database, `event_state_${String(index)}_${suffix}`, RazorpayWebhookSchema.parse({
        event: `subscription.${state}`,
        payload: { subscription: { entity: { id: `sub_${suffix}`, plan_id: price.razorpayPlanId, status: state, current_start: periods[1]?.start, current_end: periods[1]?.end } } },
      }));
      expect((await database.planSubscription.findUniqueOrThrow({ where: { id: subscription.id } })).status).toBe(state.toUpperCase());
    }
    const refund = RazorpayWebhookSchema.parse({
      event: "refund.processed",
      payload: { refund: { entity: { id: `rfnd_${suffix}`, payment_id: periods[0]?.paymentId, amount: 549900, status: "processed" } } },
    });
    await processRazorpayWebhook(database, `event_refund_${suffix}`, refund);
    const firstPaymentId = periods[0]?.paymentId;
    if (!firstPaymentId) throw new Error("Missing first payment fixture");
    expect((await database.payment.findUniqueOrThrow({ where: { razorpayPaymentId: firstPaymentId } })).status).toBe("REFUNDED");
    expect(await database.receipt.count({ where: { userId, productCode: "STUDIO_PRO_MONTHLY" } })).toBe(2);
  });
});
