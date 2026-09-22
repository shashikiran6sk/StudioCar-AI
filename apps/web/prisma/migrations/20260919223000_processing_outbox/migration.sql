CREATE TABLE "ProcessingOutboxMessage" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "jobId" UUID NOT NULL,
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "claimedAt" TIMESTAMPTZ(3),
  "claimExpiresAt" TIMESTAMPTZ(3),
  "claimToken" VARCHAR(64),
  "publishedAt" TIMESTAMPTZ(3),
  "queueMessageId" VARCHAR(255),
  "lastErrorCode" VARCHAR(80),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,

  CONSTRAINT "ProcessingOutboxMessage_pkey" PRIMARY KEY ("id")
);

INSERT INTO "ProcessingOutboxMessage" (
  "jobId",
  "nextAttemptAt",
  "createdAt",
  "updatedAt"
)
SELECT
  "id",
  "createdAt",
  "createdAt",
  CURRENT_TIMESTAMP
FROM "ProcessingJob"
WHERE "status" = 'CREATED';

CREATE UNIQUE INDEX "ProcessingOutboxMessage_jobId_key"
ON "ProcessingOutboxMessage"("jobId");

CREATE INDEX "ProcessingOutboxMessage_publishedAt_nextAttemptAt_createdAt_idx"
ON "ProcessingOutboxMessage"("publishedAt", "nextAttemptAt", "createdAt");

CREATE INDEX "ProcessingOutboxMessage_claimExpiresAt_idx"
ON "ProcessingOutboxMessage"("claimExpiresAt");

ALTER TABLE "ProcessingOutboxMessage"
ADD CONSTRAINT "ProcessingOutboxMessage_jobId_fkey"
FOREIGN KEY ("jobId") REFERENCES "ProcessingJob"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
