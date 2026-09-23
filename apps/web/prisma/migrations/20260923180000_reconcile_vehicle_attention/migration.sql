-- A vehicle's status is decided by its newest batch.
--
-- Before SC043 the worker counted failed jobs from every batch a vehicle had
-- ever run. A vehicle re-processed or given a replacement photo by a worker
-- still running that rule was recorded as PARTIALLY_FAILED even though its
-- newest batch completed, so it kept asking for attention.
--
-- This moves exactly those vehicles to READY: PARTIALLY_FAILED, with a newest
-- batch in which every job completed. A vehicle whose newest batch has a
-- failed, cancelled, or unfinished job is left alone. It is safe to run again.
WITH latest_batch AS (
  SELECT DISTINCT ON (job."vehicleId")
    job."vehicleId",
    job."batchIdempotencyKey",
    job."id"
  FROM "ProcessingJob" job
  ORDER BY job."vehicleId", job."createdAt" DESC, job."id" DESC
), latest_job AS (
  SELECT job."vehicleId", job."status"
  FROM "ProcessingJob" job
  INNER JOIN latest_batch latest
    ON latest."vehicleId" = job."vehicleId"
   AND (
     (
       latest."batchIdempotencyKey" IS NOT NULL
       AND job."batchIdempotencyKey" = latest."batchIdempotencyKey"
     )
     OR (latest."batchIdempotencyKey" IS NULL AND job."id" = latest."id")
   )
)
UPDATE "Vehicle" vehicle
SET "status" = 'READY', "updatedAt" = CURRENT_TIMESTAMP
WHERE vehicle."status" = 'PARTIALLY_FAILED'
  AND EXISTS (
    SELECT 1 FROM latest_job WHERE latest_job."vehicleId" = vehicle."id"
  )
  AND NOT EXISTS (
    SELECT 1
    FROM latest_job
    WHERE latest_job."vehicleId" = vehicle."id"
      AND latest_job."status" <> 'COMPLETED'
  );
