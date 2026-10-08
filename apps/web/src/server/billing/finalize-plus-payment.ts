import { PLUS_PRODUCT, type RazorpayWebhook } from "@studiocar/contracts";
import type { Prisma } from "@studiocar/database-runtime";
import { createReceipt } from "./create-receipt";

type CapturedPayment = Extract<RazorpayWebhook, { event: "payment.captured" }>["payload"]["payment"]["entity"];

export async function finalizePlusPayment(transaction: Prisma.TransactionClient, captured: CapturedPayment): Promise<void> {
  await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`billing-order:${captured.order_id}`}, 0))`;
  const payment = await transaction.payment.findUnique({ where: { razorpayOrderId: captured.order_id } });
  if (!payment) throw new Error("Captured order is not available for reconciliation.");
  if (payment.productCode !== PLUS_PRODUCT.code || payment.billingType !== "ONE_TIME" ||
      payment.amountPaise !== PLUS_PRODUCT.amountPaise || payment.includedImages !== PLUS_PRODUCT.credits ||
      payment.currency !== PLUS_PRODUCT.currency || captured.amount !== payment.amountPaise || captured.currency !== payment.currency) {
    throw new Error("Captured payment does not match the Plus order.");
  }
  if (payment.paidAt) {
    if (payment.razorpayPaymentId !== captured.id) throw new Error("Order has a different captured payment.");
    return;
  }
  // Share the tenant lock with processing reservations. Financial effects commit together.
  await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`billing-credit:${payment.userId}`}, 0))`;
  const paidAt = new Date(captured.created_at * 1000);
  await transaction.payment.update({ where: { id: payment.id }, data: { status: "PAID", razorpayPaymentId: captured.id, paidAt } });
  await transaction.creditLedger.create({
    data: { userId: payment.userId, amount: PLUS_PRODUCT.credits, type: "PURCHASE_GRANT", referenceId: payment.id },
  });
  await createReceipt(transaction, {
    paymentId: payment.id, userId: payment.userId, productCode: payment.productCode,
    amountPaise: payment.amountPaise, currency: payment.currency, paidAt, paymentMethod: captured.method ?? null,
  });
}
