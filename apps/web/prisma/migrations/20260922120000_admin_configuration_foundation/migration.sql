-- Administration and dynamic configuration foundation.
--
-- Every statement is additive. `PlanSubscription.source` defaults to
-- PAYMENT_PROVIDER so existing rows keep their meaning, and the two new
-- nullable columns record who assigned a manual subscription and why.
--
-- Authorization becomes a row in UserRole rather than an environment value, so
-- revoking a role takes effect everywhere immediately. AppConfig holds the
-- one-time record that first-administrator bootstrap has happened.

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "RoleGrantSource" AS ENUM ('BOOTSTRAP', 'ADMIN_GRANT', 'INVITATION');

-- CreateEnum
CREATE TYPE "AdminInviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PlanBillingInterval" AS ENUM ('NONE', 'ONE_TIME', 'MONTHLY');

-- CreateEnum
CREATE TYPE "PlanAllowanceScope" AS ENUM ('LIFETIME', 'BILLING_PERIOD');

-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('INSTAGRAM', 'LINKEDIN', 'X', 'YOUTUBE', 'FACEBOOK');

-- CreateEnum
CREATE TYPE "SubscriptionSource" AS ENUM ('PAYMENT_PROVIDER', 'MANUAL_ADMIN');

-- AlterTable
ALTER TABLE "PlanSubscription" ADD COLUMN     "assignedByUserId" UUID,
ADD COLUMN     "note" VARCHAR(500),
ADD COLUMN     "source" "SubscriptionSource" NOT NULL DEFAULT 'PAYMENT_PROVIDER';

-- CreateTable
CREATE TABLE "UserRole" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "Role" NOT NULL,
    "source" "RoleGrantSource" NOT NULL,
    "grantedByUserId" UUID,
    "grantedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppConfig" (
    "key" VARCHAR(120) NOT NULL,
    "value" JSONB NOT NULL,
    "updatedByUserId" UUID,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "AppConfig_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "AdminInvite" (
    "id" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ADMIN',
    "status" "AdminInviteStatus" NOT NULL DEFAULT 'PENDING',
    "invitedByUserId" UUID NOT NULL,
    "acceptedByUserId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMPTZ(3),
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "AdminInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanConfig" (
    "id" UUID NOT NULL,
    "planKey" VARCHAR(80) NOT NULL,
    "displayName" VARCHAR(80) NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "segment" VARCHAR(80) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "purchasable" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "priceMinorUnits" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "billingInterval" "PlanBillingInterval" NOT NULL,
    "allowanceScope" "PlanAllowanceScope" NOT NULL,
    "includedImages" INTEGER NOT NULL,
    "maxImagesPerBatch" INTEGER NOT NULL,
    "storageBytes" BIGINT,
    "features" TEXT[],
    "displayOrder" INTEGER NOT NULL,
    "providerPriceId" VARCHAR(255),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PlanConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialLink" (
    "id" UUID NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "label" VARCHAR(80) NOT NULL,
    "url" VARCHAR(2048) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "SocialLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserRole_role_grantedAt_idx" ON "UserRole"("role", "grantedAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_role_key" ON "UserRole"("userId", "role");

-- CreateIndex
CREATE INDEX "AdminInvite_email_status_idx" ON "AdminInvite"("email", "status");

-- CreateIndex
CREATE INDEX "AdminInvite_status_expiresAt_idx" ON "AdminInvite"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PlanConfig_planKey_key" ON "PlanConfig"("planKey");

-- CreateIndex
CREATE INDEX "PlanConfig_active_displayOrder_idx" ON "PlanConfig"("active", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "SocialLink_platform_key" ON "SocialLink"("platform");

-- CreateIndex
CREATE INDEX "SocialLink_enabled_displayOrder_idx" ON "SocialLink"("enabled", "displayOrder");

-- CreateIndex
CREATE INDEX "PlanSubscription_userId_source_status_idx" ON "PlanSubscription"("userId", "source", "status");

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_grantedByUserId_fkey" FOREIGN KEY ("grantedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminInvite" ADD CONSTRAINT "AdminInvite_invitedByUserId_fkey" FOREIGN KEY ("invitedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminInvite" ADD CONSTRAINT "AdminInvite_acceptedByUserId_fkey" FOREIGN KEY ("acceptedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanSubscription" ADD CONSTRAINT "PlanSubscription_assignedByUserId_fkey" FOREIGN KEY ("assignedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Configuration that cannot be wrong.
--
-- Server-side validation rejects these values first, but the database is the
-- last word: a negative price or a zero batch limit must be impossible however
-- the row was written.
ALTER TABLE "PlanConfig"
  ADD CONSTRAINT "PlanConfig_priceMinorUnits_nonnegative"
    CHECK ("priceMinorUnits" >= 0),
  ADD CONSTRAINT "PlanConfig_includedImages_positive"
    CHECK ("includedImages" > 0),
  ADD CONSTRAINT "PlanConfig_maxImagesPerBatch_positive"
    CHECK ("maxImagesPerBatch" > 0),
  ADD CONSTRAINT "PlanConfig_maxImagesPerBatch_within_allowance"
    CHECK ("maxImagesPerBatch" <= "includedImages"),
  ADD CONSTRAINT "PlanConfig_storageBytes_nonnegative"
    CHECK ("storageBytes" IS NULL OR "storageBytes" >= 0),
  ADD CONSTRAINT "PlanConfig_displayOrder_nonnegative"
    CHECK ("displayOrder" >= 0);

ALTER TABLE "SocialLink"
  ADD CONSTRAINT "SocialLink_displayOrder_nonnegative"
    CHECK ("displayOrder" >= 0),
  -- A link must be a real web address. `javascript:` and friends can never be
  -- stored, whatever validation a future caller forgets.
  ADD CONSTRAINT "SocialLink_url_is_https"
    CHECK ("url" LIKE 'https://%');

-- At most one pending invitation per email address, so an administrator cannot
-- accumulate duplicates for the same person.
CREATE UNIQUE INDEX "AdminInvite_pending_email_key"
  ON "AdminInvite"("email")
  WHERE "status" = 'PENDING';

-- One active manual subscription per tenant. A second would make "which plan
-- applies" ambiguous at exactly the moment it matters.
CREATE UNIQUE INDEX "PlanSubscription_active_manual_key"
  ON "PlanSubscription"("userId")
  WHERE "source" = 'MANUAL_ADMIN' AND "status" IN ('ACTIVE', 'TRIALING');
