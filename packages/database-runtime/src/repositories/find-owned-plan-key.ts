import type { Prisma } from "../../generated/prisma/client";

/** A lifetime purchase remains an entitlement after its balance is spent. */
export async function findOwnedPlanKey(
  database: Pick<Prisma.TransactionClient, "creditLedger">,
  userId: string,
): Promise<string | null> {
  const grant = await database.creditLedger.findFirst({
    where: { userId, type: { in: ["PURCHASE_GRANT", "ADMIN_ADJUSTMENT"] }, amount: { gt: 0 } },
    select: { id: true },
  });
  return grant ? "STUDIO_PLUS" : null;
}
