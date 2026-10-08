import type { PrismaClient } from "@studiocar/database-runtime";
import { BillingStatusQuerySchema, BillingStatusSchema } from "@studiocar/contracts";

export async function getBillingStatus(database: PrismaClient, userId: string, query: unknown = {}) {
  const { orderId } = BillingStatusQuerySchema.parse(query);
  const [ledger, granted, payment] = await Promise.all([
    database.creditLedger.aggregate({ where: { userId }, _sum: { amount: true } }),
    database.creditLedger.aggregate({ where: { userId, type: { in: ["PURCHASE_GRANT", "ADMIN_ADJUSTMENT"] } }, _sum: { amount: true } }),
    orderId ? database.payment.findFirst({ where: { userId, razorpayOrderId: orderId }, select: { status: true } }) : null,
  ]);
  return BillingStatusSchema.parse({
    purchasedCredits: Math.max(0, ledger._sum.amount ?? 0),
    purchasedCreditsGranted: Math.max(0, granted._sum.amount ?? 0),
    checkoutPaymentStatus: payment?.status ?? null,
  });
}
