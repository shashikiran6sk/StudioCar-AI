-- CreateEnum
CREATE TYPE "CommandRateLimitScope" AS ENUM ('UPLOAD_PRESIGN', 'PROCESSING_BATCH');

-- CreateTable
CREATE TABLE "CommandRateLimitEvent" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "scope" "CommandRateLimitScope" NOT NULL,
    "occurredAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommandRateLimitEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommandRateLimitEvent_userId_scope_occurredAt_idx" ON "CommandRateLimitEvent"("userId", "scope", "occurredAt");

-- CreateIndex
CREATE INDEX "CommandRateLimitEvent_occurredAt_idx" ON "CommandRateLimitEvent"("occurredAt");

-- AddForeignKey
ALTER TABLE "CommandRateLimitEvent" ADD CONSTRAINT "CommandRateLimitEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
