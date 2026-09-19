ALTER TABLE "ProcessingJob"
ADD COLUMN "nextAttemptAt" TIMESTAMPTZ(3);

CREATE INDEX "ProcessingJob_status_nextAttemptAt_idx"
ON "ProcessingJob"("status", "nextAttemptAt");
