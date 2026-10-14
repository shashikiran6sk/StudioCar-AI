import type { Prisma } from "@studiocar/database-runtime";
import type { RazorpayWebhook } from "@studiocar/contracts";

type Refund = Extract<RazorpayWebhook, { event: "refund.created" | "refund.processed" | "refund.failed" }>["payload"]["refund"]["entity"];

export async function processPlusRefund(transaction: Prisma.TransactionClient, refund: Refund): Promise<void> {
  const payment = await transaction.payment.findUnique({ where: { razorpayPaymentId: refund.payment_id } });
  if (!payment?.razorpayOrderId || !payment.paidAt) throw new Error("Refund payment requires reconciliation.");
  await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`billing-order:${payment.razorpayOrderId}`}, 0))`;
  if (refund.amount > payment.amountPaise) throw new Error("Refund exceeds payment.");
  const existing = await transaction.billingRefund.findUnique({ where: { razorpayRefundId: refund.id } });
  if (existing && (existing.paymentId !== payment.id || existing.amountPaise !== refund.amount)) throw new Error("Refund identity mismatch.");
  if (existing?.status === "processed") return;
  await transaction.billingRefund.upsert({
    where: { razorpayRefundId: refund.id },
    create: { paymentId: payment.id, razorpayRefundId: refund.id, amountPaise: refund.amount, status: refund.status },
    update: { status: refund.status },
  });
  if (refund.status !== "processed") return;
  const processed = await transaction.billingRefund.aggregate({ where: { paymentId: payment.id, status: "processed" }, _sum: { amountPaise: true } });
  const amount = processed._sum.amountPaise ?? 0;
  if (amount > payment.amountPaise) throw new Error("Total refunds exceed payment.");
  await transaction.payment.update({ where: { id: payment.id }, data: { status: amount === payment.amountPaise ? "REFUNDED" : "PARTIALLY_REFUNDED" } });
  // Spent credits cannot safely be clawed back automatically. Preserve receipt and flag review.
  await transaction.auditLog.create({ data: {
    action: "BILLING_REFUND_RECONCILIATION_REQUIRED", resourceType: "Payment", resourceId: payment.id,
    metadata: { refundId: refund.id, amountPaise: refund.amount },
  } });
}
