import { CreditAllocationSource, CreditAllocationStatus } from "../../generated/prisma/client";
import type { Prisma } from "../../generated/prisma/client";

export async function settleCreditAllocation(
  transaction: Prisma.TransactionClient,
  jobId: string,
): Promise<void> {
  const allocation = await transaction.creditAllocation.findUnique({
    where: { jobId },
    select: { id: true, source: true, status: true, allowanceId: true },
  });
  if (!allocation || allocation.status !== CreditAllocationStatus.RESERVED) return;
  await transaction.creditAllocation.update({
    where: { id: allocation.id },
    data: { status: CreditAllocationStatus.CONSUMED },
  });
  if (allocation.source === CreditAllocationSource.PRO && allocation.allowanceId) {
    await transaction.subscriptionAllowance.update({
      where: { id: allocation.allowanceId },
      data: { consumed: { increment: 1 } },
    });
  }
}
