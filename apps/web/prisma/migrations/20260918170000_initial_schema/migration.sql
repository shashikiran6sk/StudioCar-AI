-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('GOOGLE', 'PHONE');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('DRAFT', 'UPLOADING', 'PROCESSING', 'READY', 'PARTIALLY_FAILED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ImageAssetStatus" AS ENUM ('PENDING_UPLOAD', 'UPLOADED', 'INVALID', 'DELETED');

-- CreateEnum
CREATE TYPE "ProcessingJobStatus" AS ENUM ('CREATED', 'QUEUED', 'PROCESSING', 'RETRYING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProcessingProvider" AS ENUM ('REMOVEBG', 'FAL', 'BIREFNET');

-- CreateEnum
CREATE TYPE "ProcessingAttemptStatus" AS ENUM ('CLAIMED', 'STARTED', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "OutputFormat" AS ENUM ('JPEG', 'PNG', 'WEBP');

-- CreateEnum
CREATE TYPE "UsageEventType" AS ENUM ('BACKGROUND_REMOVAL_COMPLETED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "WebhookProcessingStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'FAILED', 'IGNORED');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "displayName" VARCHAR(120),
    "primaryEmail" VARCHAR(320),
    "primaryPhone" VARCHAR(20),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthIdentity" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "provider" "AuthProvider" NOT NULL,
    "providerSubject" VARCHAR(255) NOT NULL,
    "email" VARCHAR(320),
    "phoneNumber" VARCHAR(20),
    "emailVerifiedAt" TIMESTAMPTZ(3),
    "lastAuthenticatedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "AuthIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" CHAR(64) NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "lastUsedAt" TIMESTAMPTZ(3),
    "revokedAt" TIMESTAMPTZ(3),
    "rotatedFromSessionId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "brand" VARCHAR(80),
    "model" VARCHAR(80),
    "variant" VARCHAR(80),
    "year" INTEGER,
    "stockId" VARCHAR(80),
    "internalId" VARCHAR(80),
    "notes" VARCHAR(2000),
    "status" "VehicleStatus" NOT NULL DEFAULT 'DRAFT',
    "archivedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImageAsset" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "status" "ImageAssetStatus" NOT NULL DEFAULT 'PENDING_UPLOAD',
    "originalObjectKey" VARCHAR(1024) NOT NULL,
    "originalFilename" VARCHAR(255) NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "checksumSha256" CHAR(64),
    "width" INTEGER,
    "height" INTEGER,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "uploadExpiresAt" TIMESTAMPTZ(3) NOT NULL,
    "uploadedAt" TIMESTAMPTZ(3),
    "invalidReason" VARCHAR(500),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ImageAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessingJob" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "imageAssetId" UUID NOT NULL,
    "status" "ProcessingJobStatus" NOT NULL DEFAULT 'CREATED',
    "provider" "ProcessingProvider" NOT NULL,
    "options" JSONB NOT NULL,
    "idempotencyKey" VARCHAR(128) NOT NULL,
    "providerRequestId" VARCHAR(255),
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "claimedAt" TIMESTAMPTZ(3),
    "claimExpiresAt" TIMESTAMPTZ(3),
    "workerId" VARCHAR(255),
    "queuedAt" TIMESTAMPTZ(3),
    "startedAt" TIMESTAMPTZ(3),
    "completedAt" TIMESTAMPTZ(3),
    "failedAt" TIMESTAMPTZ(3),
    "cancelledAt" TIMESTAMPTZ(3),
    "errorCode" VARCHAR(80),
    "errorMessage" VARCHAR(1000),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ProcessingJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessingAttempt" (
    "id" UUID NOT NULL,
    "jobId" UUID NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "provider" "ProcessingProvider" NOT NULL,
    "status" "ProcessingAttemptStatus" NOT NULL DEFAULT 'CLAIMED',
    "providerRequestId" VARCHAR(255),
    "startedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMPTZ(3),
    "retryable" BOOLEAN,
    "errorCode" VARCHAR(80),
    "errorMessage" VARCHAR(1000),
    "providerLatencyMs" INTEGER,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessingAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessedAsset" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "jobId" UUID NOT NULL,
    "objectKey" VARCHAR(1024) NOT NULL,
    "previewObjectKey" VARCHAR(1024) NOT NULL,
    "outputFormat" "OutputFormat" NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "checksumSha256" CHAR(64),
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessedAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageEvent" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "jobId" UUID,
    "type" "UsageEventType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "billingPeriodKey" CHAR(7) NOT NULL,
    "idempotencyKey" VARCHAR(128) NOT NULL,
    "occurredAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanSubscription" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "provider" VARCHAR(50),
    "providerSubscriptionId" VARCHAR(255),
    "planKey" VARCHAR(80) NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "currentPeriodStart" TIMESTAMPTZ(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMPTZ(3) NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PlanSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" UUID NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "externalId" VARCHAR(255) NOT NULL,
    "eventType" VARCHAR(120) NOT NULL,
    "payload" JSONB NOT NULL,
    "signatureVerified" BOOLEAN NOT NULL,
    "status" "WebhookProcessingStatus" NOT NULL DEFAULT 'RECEIVED',
    "errorMessage" VARCHAR(1000),
    "receivedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMPTZ(3),

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "action" VARCHAR(120) NOT NULL,
    "resourceType" VARCHAR(80) NOT NULL,
    "resourceId" VARCHAR(255),
    "requestId" VARCHAR(128),
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_primaryEmail_key" ON "User"("primaryEmail");

-- CreateIndex
CREATE UNIQUE INDEX "User_primaryPhone_key" ON "User"("primaryPhone");

-- CreateIndex
CREATE INDEX "AuthIdentity_userId_provider_idx" ON "AuthIdentity"("userId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "AuthIdentity_provider_providerSubject_key" ON "AuthIdentity"("provider", "providerSubject");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "Session_rotatedFromSessionId_key" ON "Session"("rotatedFromSessionId");

-- CreateIndex
CREATE INDEX "Session_userId_expiresAt_idx" ON "Session"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "Session_expiresAt_revokedAt_idx" ON "Session"("expiresAt", "revokedAt");

-- CreateIndex
CREATE INDEX "Vehicle_userId_createdAt_idx" ON "Vehicle"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Vehicle_userId_status_createdAt_idx" ON "Vehicle"("userId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_userId_stockId_key" ON "Vehicle"("userId", "stockId");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_userId_internalId_key" ON "Vehicle"("userId", "internalId");

-- CreateIndex
CREATE UNIQUE INDEX "ImageAsset_originalObjectKey_key" ON "ImageAsset"("originalObjectKey");

-- CreateIndex
CREATE INDEX "ImageAsset_vehicleId_createdAt_idx" ON "ImageAsset"("vehicleId", "createdAt");

-- CreateIndex
CREATE INDEX "ImageAsset_userId_status_createdAt_idx" ON "ImageAsset"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ProcessingJob_userId_status_createdAt_idx" ON "ProcessingJob"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ProcessingJob_status_claimExpiresAt_idx" ON "ProcessingJob"("status", "claimExpiresAt");

-- CreateIndex
CREATE INDEX "ProcessingJob_imageAssetId_createdAt_idx" ON "ProcessingJob"("imageAssetId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessingJob_userId_idempotencyKey_key" ON "ProcessingJob"("userId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessingAttempt_jobId_attemptNumber_key" ON "ProcessingAttempt"("jobId", "attemptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessingAttempt_provider_providerRequestId_key" ON "ProcessingAttempt"("provider", "providerRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessedAsset_jobId_key" ON "ProcessedAsset"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessedAsset_objectKey_key" ON "ProcessedAsset"("objectKey");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessedAsset_previewObjectKey_key" ON "ProcessedAsset"("previewObjectKey");

-- CreateIndex
CREATE INDEX "ProcessedAsset_vehicleId_createdAt_idx" ON "ProcessedAsset"("vehicleId", "createdAt");

-- CreateIndex
CREATE INDEX "ProcessedAsset_userId_createdAt_idx" ON "ProcessedAsset"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UsageEvent_idempotencyKey_key" ON "UsageEvent"("idempotencyKey");

-- CreateIndex
CREATE INDEX "UsageEvent_userId_billingPeriodKey_type_idx" ON "UsageEvent"("userId", "billingPeriodKey", "type");

-- CreateIndex
CREATE INDEX "UsageEvent_userId_occurredAt_idx" ON "UsageEvent"("userId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "UsageEvent_jobId_type_key" ON "UsageEvent"("jobId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "PlanSubscription_providerSubscriptionId_key" ON "PlanSubscription"("providerSubscriptionId");

-- CreateIndex
CREATE INDEX "PlanSubscription_userId_status_currentPeriodEnd_idx" ON "PlanSubscription"("userId", "status", "currentPeriodEnd");

-- CreateIndex
CREATE INDEX "WebhookEvent_status_receivedAt_idx" ON "WebhookEvent"("status", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_provider_externalId_key" ON "WebhookEvent"("provider", "externalId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_resourceType_resourceId_createdAt_idx" ON "AuditLog"("resourceType", "resourceId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_requestId_idx" ON "AuditLog"("requestId");

-- AddForeignKey
ALTER TABLE "AuthIdentity" ADD CONSTRAINT "AuthIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_rotatedFromSessionId_fkey" FOREIGN KEY ("rotatedFromSessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImageAsset" ADD CONSTRAINT "ImageAsset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImageAsset" ADD CONSTRAINT "ImageAsset_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessingJob" ADD CONSTRAINT "ProcessingJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessingJob" ADD CONSTRAINT "ProcessingJob_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessingJob" ADD CONSTRAINT "ProcessingJob_imageAssetId_fkey" FOREIGN KEY ("imageAssetId") REFERENCES "ImageAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessingAttempt" ADD CONSTRAINT "ProcessingAttempt_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ProcessingJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessedAsset" ADD CONSTRAINT "ProcessedAsset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessedAsset" ADD CONSTRAINT "ProcessedAsset_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessedAsset" ADD CONSTRAINT "ProcessedAsset_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ProcessingJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageEvent" ADD CONSTRAINT "UsageEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageEvent" ADD CONSTRAINT "UsageEvent_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ProcessingJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanSubscription" ADD CONSTRAINT "PlanSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Domain invariants that Prisma cannot currently express in the schema.
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_year_check" CHECK ("year" IS NULL OR "year" BETWEEN 1886 AND 2200);

ALTER TABLE "ImageAsset" ADD CONSTRAINT "ImageAsset_sizeBytes_check" CHECK ("sizeBytes" > 0);
ALTER TABLE "ImageAsset" ADD CONSTRAINT "ImageAsset_width_check" CHECK ("width" IS NULL OR "width" > 0);
ALTER TABLE "ImageAsset" ADD CONSTRAINT "ImageAsset_height_check" CHECK ("height" IS NULL OR "height" > 0);
ALTER TABLE "ImageAsset" ADD CONSTRAINT "ImageAsset_displayOrder_check" CHECK ("displayOrder" >= 0);

ALTER TABLE "ProcessingJob" ADD CONSTRAINT "ProcessingJob_attempts_check" CHECK (
  "attemptCount" >= 0 AND "maxAttempts" BETWEEN 1 AND 20 AND "attemptCount" <= "maxAttempts"
);

ALTER TABLE "ProcessingAttempt" ADD CONSTRAINT "ProcessingAttempt_attemptNumber_check" CHECK ("attemptNumber" > 0);
ALTER TABLE "ProcessingAttempt" ADD CONSTRAINT "ProcessingAttempt_providerLatencyMs_check" CHECK ("providerLatencyMs" IS NULL OR "providerLatencyMs" >= 0);

ALTER TABLE "ProcessedAsset" ADD CONSTRAINT "ProcessedAsset_dimensions_check" CHECK (
  "sizeBytes" > 0 AND "width" > 0 AND "height" > 0
);

ALTER TABLE "UsageEvent" ADD CONSTRAINT "UsageEvent_quantity_check" CHECK ("quantity" > 0);
ALTER TABLE "UsageEvent" ADD CONSTRAINT "UsageEvent_billingPeriodKey_check" CHECK ("billingPeriodKey" ~ '^[0-9]{4}-(0[1-9]|1[0-2])$');

ALTER TABLE "PlanSubscription" ADD CONSTRAINT "PlanSubscription_period_check" CHECK ("currentPeriodEnd" > "currentPeriodStart");
