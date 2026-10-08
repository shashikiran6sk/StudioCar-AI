import { z } from "zod";
import type { PrismaClient } from "@studiocar/database-runtime";
import type { RazorpayEnvironment } from "@studiocar/config";
import { PLUS_PRODUCT, RazorpayPaymentEntitySchema } from "@studiocar/contracts";
import { finalizePlusPayment } from "./finalize-plus-payment";
import { RazorpayClient } from "./providers/razorpay/razorpay-client";

export async function reconcilePlusOrder(database: PrismaClient, environment: RazorpayEnvironment, orderId: string): Promise<number> {
  const provider = new RazorpayClient(environment);
  const order = await provider.getOrder(orderId);
  if (order.id !== orderId || order.amount !== PLUS_PRODUCT.amountPaise || order.currency !== PLUS_PRODUCT.currency) throw new Error("Provider order does not match Plus.");
  // Recover an Orders API success followed by a failed local association.
  const local = await database.payment.findUnique({ where: { id: order.receipt }, select: { id: true, razorpayOrderId: true, amountPaise: true, currency: true } });
  if (!local || (local.razorpayOrderId && local.razorpayOrderId !== orderId) || local.amountPaise !== order.amount || local.currency !== order.currency) throw new Error("Provider receipt does not match a local order.");
  await database.payment.updateMany({ where: { id: local.id, razorpayOrderId: null }, data: { razorpayOrderId: orderId } });
  const payments = await provider.getOrderPayments(orderId);
  const captured = payments.filter((payment) => payment.status === "captured");
  for (const payment of captured) {
    const entity = RazorpayPaymentEntitySchema.extend({ status: z.literal("captured") }).parse(payment);
    if (entity.order_id !== orderId) throw new Error("Provider returned a different order.");
    await database.$transaction(async (transaction) => {
      await finalizePlusPayment(transaction, entity);
      await transaction.auditLog.create({ data: {
        action: "BILLING_PAYMENT_RECONCILED", resourceType: "Payment", resourceId: local.id, metadata: { orderId },
      } });
    });
  }
  return captured.length;
}
