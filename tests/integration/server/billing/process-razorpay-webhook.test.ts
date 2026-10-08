import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

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
    await database.creditLedger.deleteMany({ where: { userId } });
    await database.billingRefund.deleteMany({ where: { payment: { userId } } });
    await database.payment.deleteMany({ where: { userId } });
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
    await Promise.all([`event_plus_${suffix}`, `event_plus_${suffix}`, `event_plus_retry_${suffix}`].map((id) => processRazorpayWebhook(database, id, event)));
    expect(await database.creditLedger.count({ where: { userId, type: "PURCHASE_GRANT" } })).toBe(1);
    expect(await database.creditLedger.aggregate({ where: { userId }, _sum: { amount: true } })).toMatchObject({ _sum: { amount: 100 } });
    expect(await database.receipt.count({ where: { paymentId: payment.id } })).toBe(1);
    expect((await database.payment.findUniqueOrThrow({ where: { id: payment.id } })).status).toBe("PAID");
  });


  async function order(label: string) {
    return database.payment.create({ data: { userId, productCode: "STUDIO_PLUS", billingType: "ONE_TIME",
      razorpayOrderId: `order_${label}${suffix}`, amountPaise: 199900, currency: "INR", includedImages: 100 } });
  }
  function captured(orderId: string, label: string, amount = 199900, currency = "INR") {
    return RazorpayWebhookSchema.parse({ event: "payment.captured", payload: { payment: { entity: {
      id: `pay_${label}${suffix}`, order_id: orderId, amount, currency, status: "captured", created_at: 1704067200,
    } } } });
  }
  it("adds repeat purchases to the remaining balance across months and years", async () => {
    const before = (await database.creditLedger.aggregate({ where: { userId }, _sum: { amount: true } }))._sum.amount ?? 0;
    const first = await order("repeatA"); const second = await order("repeatB");
    if (!first.razorpayOrderId || !second.razorpayOrderId) throw new Error("Expected orders");
    await processRazorpayWebhook(database, `repeatA${suffix}`, captured(first.razorpayOrderId, "repeatA"));
    await database.creditLedger.create({ data: { userId, type: "PROCESSING_DEBIT", amount: -25, referenceId: `spent${suffix}` } });
    await processRazorpayWebhook(database, `repeatB${suffix}`, captured(second.razorpayOrderId, "repeatB"));
    const balance = (await database.creditLedger.aggregate({ where: { userId }, _sum: { amount: true } }))._sum.amount;
    expect(balance).toBe(before + 175);
    expect((await database.payment.findUniqueOrThrow({ where: { id: first.id } })).paidAt?.getUTCFullYear()).toBe(2024);
  });
  it.each([[1, "INR"], [199900, "USD"]])("rejects wrong captured amount/currency %s/%s and retains a retryable inbox", async (amount, currency) => {
    const label = `bad${currency}${String(amount)}`; const payment = await order(label);
    if (!payment.razorpayOrderId) throw new Error("Expected order");
    const eventId = `${label}${suffix}`;
    await expect(processRazorpayWebhook(database, eventId, captured(payment.razorpayOrderId, label, amount, currency))).rejects.toThrow();
    const inbox = await database.webhookEvent.findUniqueOrThrow({ where: { provider_externalId: { provider: "RAZORPAY", externalId: eventId } } });
    expect(inbox.status).toBe("FAILED"); expect(inbox.processedAt).toBeNull();
    expect(await database.creditLedger.count({ where: { referenceId: payment.id } })).toBe(0);
  });
  it("recovers a webhook delivered before its local order association", async () => {
    const eventId = `early${suffix}`; const orderId = `order_early${suffix}`; const event = captured(orderId, "early");
    await expect(processRazorpayWebhook(database, eventId, event)).rejects.toThrow();
    expect((await database.webhookEvent.findUniqueOrThrow({ where: { provider_externalId: { provider: "RAZORPAY", externalId: eventId } } })).status).toBe("FAILED");
    const payment = await order("early");
    await processRazorpayWebhook(database, eventId, event);
    expect(await database.creditLedger.count({ where: { referenceId: payment.id } })).toBe(1);
  });
  it("rolls back financial mutations on transient database failure and retries safely", async () => {
    const payment = await order("transient"); if (!payment.razorpayOrderId) throw new Error("Expected order");
    const event = captured(payment.razorpayOrderId, "transient"); const id = `transient${suffix}`;
    const transaction = vi.spyOn(database, "$transaction").mockRejectedValueOnce(new Error("Transient connection loss"));
    await expect(processRazorpayWebhook(database, id, event)).rejects.toThrow(); transaction.mockRestore();
    expect(await database.creditLedger.count({ where: { referenceId: payment.id } })).toBe(0);
    await processRazorpayWebhook(database, id, event);
    expect(await database.creditLedger.count({ where: { referenceId: payment.id } })).toBe(1);
  });
  it("failed payments never grant credits, and late failures cannot regress capture", async () => {
    const payment = await order("failed"); if (!payment.razorpayOrderId) throw new Error("Expected order");
    const failed = RazorpayWebhookSchema.parse({ event: "payment.failed", payload: { payment: { entity: {
      id: `pay_failed${suffix}`, order_id: payment.razorpayOrderId, amount: 199900, currency: "INR", status: "failed", created_at: 1,
    } } } });
    await processRazorpayWebhook(database, `failed${suffix}`, failed);
    expect(await database.creditLedger.count({ where: { referenceId: payment.id } })).toBe(0);
    await processRazorpayWebhook(database, `capturedAfterFailed${suffix}`, captured(payment.razorpayOrderId, "failed"));
    await processRazorpayWebhook(database, `lateFailed${suffix}`, failed);
    expect((await database.payment.findUniqueOrThrow({ where: { id: payment.id } })).status).toBe("PAID");
  });
  it("retains receipts and spent credits on refunds and cannot re-grant a refunded payment", async () => {
    const payment = await order("refund"); if (!payment.razorpayOrderId) throw new Error("Expected order");
    const capture = captured(payment.razorpayOrderId, "refund");
    await processRazorpayWebhook(database, `captureRefund${suffix}`, capture);
    const before = (await database.creditLedger.aggregate({ where: { userId }, _sum: { amount: true } }))._sum.amount;
    const refund = RazorpayWebhookSchema.parse({ event: "refund.processed", payload: { refund: { entity: {
      id: `rfnd_${suffix}`, payment_id: `pay_refund${suffix}`, amount: 199900, status: "processed",
    } } } });
    await Promise.all([0, 1].map((n) => processRazorpayWebhook(database, `refund${String(n)}${suffix}`, refund)));
    await processRazorpayWebhook(database, `captureRefundAgain${suffix}`, capture);
    expect((await database.payment.findUniqueOrThrow({ where: { id: payment.id } })).status).toBe("REFUNDED");
    expect(await database.receipt.count({ where: { paymentId: payment.id } })).toBe(1);
    expect(await database.auditLog.count({ where: { resourceId: payment.id, action: "BILLING_REFUND_RECONCILIATION_REQUIRED" } })).toBe(1);
    expect((await database.creditLedger.aggregate({ where: { userId }, _sum: { amount: true } }))._sum.amount).toBe(before);
    expect(await database.creditLedger.count({ where: { referenceId: payment.id } })).toBe(1);
  });

});
