import type { PrismaClient } from "@studiocar/database-runtime";
import {
  Prisma,
  ProcessingJobStatus,
} from "@studiocar/database-runtime";

export interface InventoryBatchSummary {
  completedImageCount: number;
  failedImageCount: number;
  imageCount: number;
  previewObjectKey: string | null;
  vehicleId: string;
}

export async function findInventoryBatchSummaries(
  database: PrismaClient,
  userId: string,
  vehicleIds: string[],
): Promise<Map<string, InventoryBatchSummary>> {
  if (vehicleIds.length === 0) return new Map();

  const summaries = await database.$queryRaw<InventoryBatchSummary[]>`
    WITH latest_batch AS (
      SELECT DISTINCT ON (job."vehicleId")
        job."vehicleId",
        job."batchRequestHash",
        job."id"
      FROM "ProcessingJob" job
      WHERE job."userId" = ${userId}
        AND job."vehicleId" IN (${Prisma.join(vehicleIds)})
      ORDER BY job."vehicleId", job."createdAt" DESC, job."id" DESC
    ), current_job AS (
      SELECT
        job."id",
        job."vehicleId",
        job."status",
        job."displayOrder"
      FROM "ProcessingJob" job
      INNER JOIN latest_batch latest
        ON latest."vehicleId" = job."vehicleId"
       AND (
         (
           latest."batchRequestHash" IS NOT NULL
           AND job."batchRequestHash" = latest."batchRequestHash"
         )
         OR (
           latest."batchRequestHash" IS NULL
           AND job."id" = latest."id"
         )
       )
      WHERE job."userId" = ${userId}
    )
    SELECT
      current_job."vehicleId",
      COUNT(*)::integer AS "imageCount",
      COUNT(*) FILTER (
        WHERE current_job."status" = ${ProcessingJobStatus.COMPLETED}::"ProcessingJobStatus"
      )::integer AS "completedImageCount",
      COUNT(*) FILTER (
        WHERE current_job."status" = ${ProcessingJobStatus.FAILED}::"ProcessingJobStatus"
           OR current_job."status" = ${ProcessingJobStatus.CANCELLED}::"ProcessingJobStatus"
      )::integer AS "failedImageCount",
      (
        ARRAY_AGG(
          processed."previewObjectKey"
          ORDER BY current_job."displayOrder", current_job."id"
        ) FILTER (WHERE processed."previewObjectKey" IS NOT NULL)
      )[1] AS "previewObjectKey"
    FROM current_job
    LEFT JOIN "ProcessedAsset" processed
      ON processed."jobId" = current_job."id"
    GROUP BY current_job."vehicleId"
  `;

  return new Map(summaries.map((summary) => [summary.vehicleId, summary]));
}
