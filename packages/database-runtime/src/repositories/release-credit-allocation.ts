import type { Prisma } from "../../generated/prisma/client";

export async function releaseCreditAllocation(transaction: Prisma.TransactionClient, jobId: string): Promise<void> {
  const allocation = await transaction.creditAllocation.findUnique({ where: { jobId }, select: { userId: true } });
  if (!allocation) return;
  const released = await transaction.creditAllocation.updateMany({
    where: { jobId, status: "RESERVED" }, data: { status: "RELEASED" },
  });
  if (released.count !== 1) return;
  await transaction.creditLedger.create({
    data: { userId: allocation.userId, amount: 1, type: "PROCESSING_REFUND", referenceId: jobId },
  });
}
