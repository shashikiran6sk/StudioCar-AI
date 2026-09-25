import { CreditAllocationSource, CreditAllocationStatus, CreditLedgerType } from "../../generated/prisma/client";
import type { Prisma } from "../../generated/prisma/client";

export async function releaseCreditAllocation(
  transaction: Prisma.TransactionClient,
  jobId: string,
): Promise<void> {
  const allocation = await transaction.creditAllocation.findUnique({
    where: { jobId },
    select: { id: true, userId: true, source: true, status: true },
  });
  if (!allocation || allocation.status !== CreditAllocationStatus.RESERVED) return;
  await transaction.creditAllocation.update({
    where: { id: allocation.id },
    data: { status: CreditAllocationStatus.RELEASED },
  });
  if (allocation.source === CreditAllocationSource.PURCHASED) {
    await transaction.creditLedger.create({
      data: {
        userId: allocation.userId,
        amount: 1,
        type: CreditLedgerType.PROCESSING_REFUND,
        referenceId: jobId,
      },
    });
  }
}
