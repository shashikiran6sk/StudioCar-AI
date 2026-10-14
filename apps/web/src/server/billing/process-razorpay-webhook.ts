import { RazorpayWebhookSchema, type RazorpayWebhook } from "@studiocar/contracts";
import type { PrismaClient } from "@studiocar/database-runtime";
import { finalizePlusPayment } from "./finalize-plus-payment";
import { processPlusRefund } from "./process-plus-refund";

const BILLING_EVENT_FAILURE_MESSAGE = "Billing event requires retry or reconciliation.";

export async function processRazorpayWebhook(database: PrismaClient, eventId: string, input: RazorpayWebhook): Promise<void> {
  const event = RazorpayWebhookSchema.parse(input);
  // Durable sanitized inbox survives a failed finalization; it stores no raw provider/customer payload.
  await database.webhookEvent.createMany({ data: [{
    provider: "RAZORPAY", externalId: eventId, eventType: event.event,
    payload: event, signatureVerified: true, status: "RECEIVED",
  }], skipDuplicates: true });
  try {
    await database.$transaction(async (transaction) => {
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`billing-event:${eventId}`}, 0))`;
      const inbox = await transaction.webhookEvent.findUniqueOrThrow({ where: { provider_externalId: { provider: "RAZORPAY", externalId: eventId } } });
      if (JSON.stringify(inbox.payload) !== JSON.stringify(event)) {
        // JSONB key order is not stable: validate normalized objects before comparing below.
        const stored = RazorpayWebhookSchema.parse(inbox.payload);
        if (JSON.stringify(stored) !== JSON.stringify(event)) throw new Error("Webhook event identity mismatch.");
      }
      if (inbox.status === "PROCESSED") return;
      if (event.event === "payment.captured") {
        await finalizePlusPayment(transaction, event.payload.payment.entity);
      } else if (event.event === "payment.failed") {
        const failed = event.payload.payment.entity;
        await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`billing-order:${failed.order_id}`}, 0))`;
        const payment = await transaction.payment.findUnique({ where: { razorpayOrderId: failed.order_id }, select: { id: true, paidAt: true } });
        if (!payment) throw new Error("Failed order requires reconciliation.");
        if (!payment.paidAt) await transaction.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
      } else {
        await processPlusRefund(transaction, event.payload.refund.entity);
      }
      await transaction.webhookEvent.update({ where: { id: inbox.id }, data: { status: "PROCESSED", processedAt: new Date(), errorMessage: null } });
    });
  } catch (error) {
    await database.webhookEvent.updateMany({
      where: { provider: "RAZORPAY", externalId: eventId, status: { not: "PROCESSED" } },
      data: { status: "FAILED", errorMessage: BILLING_EVENT_FAILURE_MESSAGE },
    });
    throw error;
  }
}
