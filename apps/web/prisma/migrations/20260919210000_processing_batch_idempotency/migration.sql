ALTER TABLE "ProcessingJob"
ADD COLUMN "batchIdempotencyKey" VARCHAR(128),
ADD COLUMN "batchRequestHash" CHAR(64),
ADD COLUMN "displayOrder" INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX "ProcessingJob_userId_batchIdempotencyKey_imageAssetId_key"
ON "ProcessingJob"("userId", "batchIdempotencyKey", "imageAssetId");

CREATE INDEX "ProcessingJob_userId_batchIdempotencyKey_idx"
ON "ProcessingJob"("userId", "batchIdempotencyKey");
