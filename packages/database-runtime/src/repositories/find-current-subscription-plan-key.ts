import type { Prisma } from "../../generated/prisma/client";
import { SubscriptionStatus } from "../../generated/prisma/client";

/**
 * The plan key of the subscription that currently applies to an account, or
 * null when none does. One definition shared by allowances in the web
 * application and by processing resolution in the worker, so both always
 * agree on which plan an account is on.
 */
export async function findCurrentSubscriptionPlanKey(
  database: Pick<Prisma.TransactionClient, "planSubscription">,
  userId: string,
  now: Date,
): Promise<string | null> {
  const subscription = await database.planSubscription.findFirst({
    where: {
      currentPeriodEnd: { gt: now },
      status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
      userId,
    },
    orderBy: [{ currentPeriodEnd: "desc" }, { id: "desc" }],
    select: { planKey: true },
  });
  return subscription?.planKey ?? null;
}
