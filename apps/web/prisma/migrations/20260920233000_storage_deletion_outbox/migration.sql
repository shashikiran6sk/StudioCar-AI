-- CreateEnum
CREATE TYPE "StorageDeletionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "StorageDeletionOutboxMessage" (
    "id" UUID NOT NULL,
    "imageAssetId" UUID NOT NULL,
    "objectKey" VARCHAR(1024) NOT NULL,
    "status" "StorageDeletionStatus" NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimedAt" TIMESTAMPTZ(3),
    "claimExpiresAt" TIMESTAMPTZ(3),
    "claimToken" VARCHAR(64),
    "deletedAt" TIMESTAMPTZ(3),
    "failedAt" TIMESTAMPTZ(3),
    "lastErrorCode" VARCHAR(80),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "StorageDeletionOutboxMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StorageDeletionOutboxMessage_imageAssetId_key" ON "StorageDeletionOutboxMessage"("imageAssetId");

-- CreateIndex
CREATE UNIQUE INDEX "StorageDeletionOutboxMessage_objectKey_key" ON "StorageDeletionOutboxMessage"("objectKey");

-- CreateIndex
CREATE INDEX "StorageDeletionOutboxMessage_status_nextAttemptAt_createdAt_idx" ON "StorageDeletionOutboxMessage"("status", "nextAttemptAt", "createdAt");

-- CreateIndex
CREATE INDEX "StorageDeletionOutboxMessage_claimExpiresAt_idx" ON "StorageDeletionOutboxMessage"("claimExpiresAt");

-- CreateIndex
CREATE INDEX "ImageAsset_status_uploadExpiresAt_id_idx" ON "ImageAsset"("status", "uploadExpiresAt", "id");

-- AddForeignKey
ALTER TABLE "StorageDeletionOutboxMessage" ADD CONSTRAINT "StorageDeletionOutboxMessage_imageAssetId_fkey" FOREIGN KEY ("imageAssetId") REFERENCES "ImageAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
