import type { PrismaClient } from "@studiocar/database-runtime";
import { CreditAllocationStatus, SubscriptionSource } from "@studiocar/database-runtime";

export async function getBillingStatus(database: PrismaClient, userId: string) {
  const now = new Date();
  const subscription = await database.planSubscription.findFirst({
    where: { userId, source: SubscriptionSource.PAYMENT_PROVIDER },
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      status: true,
      currentPeriodStart: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
      planPrice: { select: { priceMinorUnits: true } },
    },
  });
  const allowance = subscription
    ? await database.subscriptionAllowance.findFirst({
        where: { userId, subscriptionId: subscription.id, periodStart: { lte: now }, periodEnd: { gt: now } },
        orderBy: { periodStart: "desc" },
        select: { id: true, allowance: true, consumed: true, periodStart: true, periodEnd: true },
      })
    : null;
  const [ledger, granted, reserved] = await Promise.all([
    database.creditLedger.aggregate({ where: { userId }, _sum: { amount: true } }),
    database.creditLedger.aggregate({ where: { userId, type: { in: ["PURCHASE_GRANT", "ADMIN_ADJUSTMENT"] } }, _sum: { amount: true } }),
    allowance
      ? database.creditAllocation.count({ where: { allowanceId: allowance.id, status: CreditAllocationStatus.RESERVED } })
      : Promise.resolve(0),
  ]);
  return {
    subscription: subscription ? {
      plan: "STUDIO_PRO_MONTHLY",
      status: subscription.status,
      pricePaise: subscription.planPrice?.priceMinorUnits ?? null,
      currentPeriodStart: allowance?.periodStart.toISOString() ?? null,
      currentPeriodEnd: allowance?.periodEnd.toISOString() ?? null,
      allowance: allowance?.allowance ?? 0,
      consumed: allowance?.consumed ?? 0,
      remaining: subscription.status === "ACTIVE" && allowance
        ? Math.max(0, allowance.allowance - allowance.consumed - reserved)
        : 0,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    } : null,
    purchasedCredits: Math.max(0, ledger._sum.amount ?? 0),
    purchasedCreditsGranted: Math.max(0, granted._sum.amount ?? 0),
  };
}
