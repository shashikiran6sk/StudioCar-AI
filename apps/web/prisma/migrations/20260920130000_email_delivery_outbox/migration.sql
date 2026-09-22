-- CreateEnum
CREATE TYPE "EmailMessageType" AS ENUM ('PROCESSING_COMPLETED');

-- CreateEnum
CREATE TYPE "EmailDeliveryStatus" AS ENUM ('PENDING', 'QUEUED', 'PROCESSING', 'DELIVERED', 'FAILED');

-- CreateTable
CREATE TABLE "EmailOutboxMessage" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "batchIdempotencyKey" VARCHAR(128) NOT NULL,
    "type" "EmailMessageType" NOT NULL,
    "recipient" VARCHAR(320) NOT NULL,
    "vehicleName" VARCHAR(120) NOT NULL,
    "status" "EmailDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "publishAttemptCount" INTEGER NOT NULL DEFAULT 0,
    "publishNextAttemptAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishClaimedAt" TIMESTAMPTZ(3),
    "publishClaimExpiresAt" TIMESTAMPTZ(3),
    "publishClaimToken" VARCHAR(64),
    "publishedAt" TIMESTAMPTZ(3),
    "queueMessageId" VARCHAR(255),
    "deliveryAttemptCount" INTEGER NOT NULL DEFAULT 0,
    "deliveryClaimedAt" TIMESTAMPTZ(3),
    "deliveryClaimExpiresAt" TIMESTAMPTZ(3),
    "deliveryClaimToken" VARCHAR(64),
    "providerMessageId" VARCHAR(255),
    "deliveredAt" TIMESTAMPTZ(3),
    "failedAt" TIMESTAMPTZ(3),
    "lastErrorCode" VARCHAR(80),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "EmailOutboxMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailOutboxMessage_userId_batchIdempotencyKey_type_key" ON "EmailOutboxMessage"("userId", "batchIdempotencyKey", "type");

-- CreateIndex
CREATE INDEX "EmailOutboxMessage_status_publishNextAttemptAt_createdAt_idx" ON "EmailOutboxMessage"("status", "publishNextAttemptAt", "createdAt");

-- CreateIndex
CREATE INDEX "EmailOutboxMessage_publishClaimExpiresAt_idx" ON "EmailOutboxMessage"("publishClaimExpiresAt");

-- CreateIndex
CREATE INDEX "EmailOutboxMessage_deliveryClaimExpiresAt_idx" ON "EmailOutboxMessage"("deliveryClaimExpiresAt");

-- CreateIndex
CREATE INDEX "EmailOutboxMessage_userId_createdAt_idx" ON "EmailOutboxMessage"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "EmailOutboxMessage" ADD CONSTRAINT "EmailOutboxMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailOutboxMessage" ADD CONSTRAINT "EmailOutboxMessage_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
