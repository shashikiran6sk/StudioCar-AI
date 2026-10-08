import type { Prisma } from "../../generated/prisma/client";

export async function settleCreditAllocation(transaction: Prisma.TransactionClient, jobId: string): Promise<void> {
  await transaction.creditAllocation.updateMany({
    where: { jobId, status: "RESERVED" },
    data: { status: "CONSUMED" },
  });
}
