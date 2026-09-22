import type { PrismaClient } from "@studiocar/database-runtime";
import type { Prisma } from "@studiocar/database-runtime";

const processingJobStatusSelect = {
  id: true,
  imageAssetId: true,
  status: true,
  nextAttemptAt: true,
  errorCode: true,
  updatedAt: true,
  vehicle: { select: { id: true, name: true } },
  processedAsset: { select: { id: true } },
  attempts: {
    orderBy: { attemptNumber: "desc" },
    take: 1,
    select: { retryable: true },
  },
} satisfies Prisma.ProcessingJobSelect;

export type ProcessingJobStatusRecord = Prisma.ProcessingJobGetPayload<{
  select: typeof processingJobStatusSelect;
}>;

export type FindProcessingJobStatusesResult =
  | { kind: "FOUND"; jobs: ProcessingJobStatusRecord[] }
  | { kind: "NOT_FOUND" };

export class PrismaProcessingJobStatusRepository {
  public constructor(private readonly database: PrismaClient) {}

  public async findOwned(
    userId: string,
    jobIds: string[],
  ): Promise<FindProcessingJobStatusesResult> {
    const jobs = await this.database.processingJob.findMany({
      where: { id: { in: jobIds }, userId },
      select: processingJobStatusSelect,
    });
    if (jobs.length !== jobIds.length) return { kind: "NOT_FOUND" };

    const jobsById = new Map(jobs.map((job) => [job.id, job]));
    const orderedJobs: ProcessingJobStatusRecord[] = [];
    for (const jobId of jobIds) {
      const job = jobsById.get(jobId);
      if (!job) return { kind: "NOT_FOUND" };
      orderedJobs.push(job);
    }
    return { kind: "FOUND", jobs: orderedJobs };
  }
}
