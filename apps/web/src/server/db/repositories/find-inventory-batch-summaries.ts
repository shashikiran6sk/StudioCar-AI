import type { PrismaClient } from "@studiocar/database-runtime";
import {
  Prisma,
  ProcessingJobStatus,
} from "@studiocar/database-runtime";

export interface InventoryBatchSummary {
  completedImageCount: number;
  failedImageCount: number;
  hasCompletedOutput: boolean;
  imageCount: number;
  previewObjectKey: string | null;
  vehicleId: string;
}

/**
 * Summarises each vehicle's newest batch, plus whether any of its batches
 * produced a studio image.
 *
 * A batch is identified by its idempotency key, not its request hash: an
 * unchanged re-process has the same hash as the batch it retries, and must
 * still count as a batch of its own.
 */
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
        job."batchIdempotencyKey",
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
           latest."batchIdempotencyKey" IS NOT NULL
           AND job."batchIdempotencyKey" = latest."batchIdempotencyKey"
         )
         OR (
           latest."batchIdempotencyKey" IS NULL
           AND job."id" = latest."id"
         )
       )
      WHERE job."userId" = ${userId}
    ), latest_output AS (
      SELECT DISTINCT ON (processed."vehicleId")
        processed."vehicleId",
        processed."previewObjectKey"
      FROM "ProcessedAsset" processed
      WHERE processed."userId" = ${userId}
        AND processed."vehicleId" IN (${Prisma.join(vehicleIds)})
      ORDER BY processed."vehicleId", processed."createdAt" DESC, processed."id" DESC
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
      BOOL_OR(latest_output."vehicleId" IS NOT NULL) AS "hasCompletedOutput",
      COALESCE(
        (
          ARRAY_AGG(
            processed."previewObjectKey"
            ORDER BY current_job."displayOrder", current_job."id"
          ) FILTER (WHERE processed."previewObjectKey" IS NOT NULL)
        )[1],
        MAX(latest_output."previewObjectKey")
      ) AS "previewObjectKey"
    FROM current_job
    LEFT JOIN "ProcessedAsset" processed
      ON processed."jobId" = current_job."id"
    LEFT JOIN latest_output
      ON latest_output."vehicleId" = current_job."vehicleId"
    GROUP BY current_job."vehicleId"
  `;

  return new Map(summaries.map((summary) => [summary.vehicleId, summary]));
}
