-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('CREATED', 'VERIFIED', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "CreditAllocationSource" AS ENUM ('PRO', 'PURCHASED');

-- CreateEnum
CREATE TYPE "CreditAllocationStatus" AS ENUM ('RESERVED', 'CONSUMED', 'RELEASED');

-- CreateEnum
CREATE TYPE "CreditLedgerType" AS ENUM ('PURCHASE_GRANT', 'PROCESSING_DEBIT', 'PROCESSING_REFUND', 'REFUND_REVERSAL', 'ADMIN_ADJUSTMENT');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SubscriptionStatus" ADD VALUE 'CREATED';
ALTER TYPE "SubscriptionStatus" ADD VALUE 'AUTHENTICATED';
ALTER TYPE "SubscriptionStatus" ADD VALUE 'PENDING';
ALTER TYPE "SubscriptionStatus" ADD VALUE 'PAUSED';
ALTER TYPE "SubscriptionStatus" ADD VALUE 'HALTED';
ALTER TYPE "SubscriptionStatus" ADD VALUE 'COMPLETED';

-- AlterTable
ALTER TABLE "PlanSubscription" ADD COLUMN     "planPriceId" UUID,
ADD COLUMN     "razorpayPlanId" VARCHAR(255);

-- CreateTable
CREATE TABLE "PlanPrice" (
    "id" UUID NOT NULL,
    "planConfigId" UUID NOT NULL,
    "environment" VARCHAR(20) NOT NULL,
    "priceMinorUnits" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "includedImages" INTEGER NOT NULL,
    "razorpayPlanId" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "productCode" VARCHAR(80) NOT NULL,
    "billingType" "PlanBillingInterval" NOT NULL,
    "planPriceId" UUID,
    "subscriptionId" UUID,
    "razorpayOrderId" VARCHAR(255),
    "razorpayPaymentId" VARCHAR(255),
    "razorpaySubscriptionId" VARCHAR(255),
    "amountPaise" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "includedImages" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'CREATED',
    "paidAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingRefund" (
    "id" UUID NOT NULL,
    "paymentId" UUID NOT NULL,
    "razorpayRefundId" VARCHAR(255) NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "status" VARCHAR(40) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingRefund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receipt" (
    "id" UUID NOT NULL,
    "receiptNumber" VARCHAR(40) NOT NULL,
    "userId" UUID NOT NULL,
    "paymentId" UUID NOT NULL,
    "productCode" VARCHAR(80) NOT NULL,
    "productName" VARCHAR(120) NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "subtotalPaise" INTEGER NOT NULL,
    "taxPaise" INTEGER NOT NULL,
    "totalPaise" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "paidAt" TIMESTAMPTZ(3) NOT NULL,
    "paymentMethod" VARCHAR(40),
    "customerName" VARCHAR(120),
    "customerEmail" VARCHAR(320),
    "customerPhone" VARCHAR(20),
    "businessType" VARCHAR(40) NOT NULL,
    "businessLegalName" VARCHAR(160) NOT NULL,
    "tradingName" VARCHAR(160) NOT NULL,
    "proprietorName" VARCHAR(160) NOT NULL,
    "businessAddress" VARCHAR(1000) NOT NULL,
    "billingEmail" VARCHAR(320) NOT NULL,
    "businessGstin" VARCHAR(15),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionAllowance" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "subscriptionId" UUID NOT NULL,
    "providerPaymentId" VARCHAR(255) NOT NULL,
    "periodStart" TIMESTAMPTZ(3) NOT NULL,
    "periodEnd" TIMESTAMPTZ(3) NOT NULL,
    "allowance" INTEGER NOT NULL,
    "consumed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionAllowance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditLedger" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" "CreditLedgerType" NOT NULL,
    "referenceId" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditAllocation" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "jobId" UUID NOT NULL,
    "allowanceId" UUID,
    "source" "CreditAllocationSource" NOT NULL,
    "status" "CreditAllocationStatus" NOT NULL DEFAULT 'RESERVED',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlanPrice_razorpayPlanId_key" ON "PlanPrice"("razorpayPlanId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanPrice_planConfigId_environment_priceMinorUnits_included_key" ON "PlanPrice"("planConfigId", "environment", "priceMinorUnits", "includedImages");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_razorpayOrderId_key" ON "Payment"("razorpayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_razorpayPaymentId_key" ON "Payment"("razorpayPaymentId");

-- CreateIndex
CREATE INDEX "Payment_userId_createdAt_idx" ON "Payment"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Payment_razorpaySubscriptionId_idx" ON "Payment"("razorpaySubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "BillingRefund_razorpayRefundId_key" ON "BillingRefund"("razorpayRefundId");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_receiptNumber_key" ON "Receipt"("receiptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_paymentId_key" ON "Receipt"("paymentId");

-- CreateIndex
CREATE INDEX "Receipt_userId_createdAt_idx" ON "Receipt"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionAllowance_providerPaymentId_key" ON "SubscriptionAllowance"("providerPaymentId");

-- CreateIndex
CREATE INDEX "SubscriptionAllowance_userId_periodEnd_idx" ON "SubscriptionAllowance"("userId", "periodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionAllowance_subscriptionId_periodStart_key" ON "SubscriptionAllowance"("subscriptionId", "periodStart");

-- CreateIndex
CREATE INDEX "CreditLedger_userId_createdAt_idx" ON "CreditLedger"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CreditLedger_type_referenceId_key" ON "CreditLedger"("type", "referenceId");

-- CreateIndex
CREATE UNIQUE INDEX "CreditAllocation_jobId_key" ON "CreditAllocation"("jobId");

-- CreateIndex
CREATE INDEX "CreditAllocation_userId_source_status_idx" ON "CreditAllocation"("userId", "source", "status");

-- AddForeignKey
ALTER TABLE "PlanPrice" ADD CONSTRAINT "PlanPrice_planConfigId_fkey" FOREIGN KEY ("planConfigId") REFERENCES "PlanConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanSubscription" ADD CONSTRAINT "PlanSubscription_planPriceId_fkey" FOREIGN KEY ("planPriceId") REFERENCES "PlanPrice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_planPriceId_fkey" FOREIGN KEY ("planPriceId") REFERENCES "PlanPrice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "PlanSubscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingRefund" ADD CONSTRAINT "BillingRefund_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionAllowance" ADD CONSTRAINT "SubscriptionAllowance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionAllowance" ADD CONSTRAINT "SubscriptionAllowance_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "PlanSubscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditLedger" ADD CONSTRAINT "CreditLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditAllocation" ADD CONSTRAINT "CreditAllocation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditAllocation" ADD CONSTRAINT "CreditAllocation_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ProcessingJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditAllocation" ADD CONSTRAINT "CreditAllocation_allowanceId_fkey" FOREIGN KEY ("allowanceId") REFERENCES "SubscriptionAllowance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE SEQUENCE "BillingReceiptNumber_seq";

CREATE UNIQUE INDEX "PlanSubscription_one_provider_open_per_user"
  ON "PlanSubscription"("userId")
  WHERE "source" = 'PAYMENT_PROVIDER' AND "status" IN
    ('CREATED', 'AUTHENTICATED', 'TRIALING', 'ACTIVE', 'PENDING', 'PAUSED', 'HALTED', 'PAST_DUE');

ALTER TABLE "SubscriptionAllowance" ADD CONSTRAINT "SubscriptionAllowance_valid"
  CHECK ("allowance" > 0 AND "consumed" >= 0 AND "consumed" <= "allowance" AND "periodEnd" > "periodStart");
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_amount_positive" CHECK ("amountPaise" > 0);
ALTER TABLE "BillingRefund" ADD CONSTRAINT "BillingRefund_amount_positive" CHECK ("amountPaise" > 0);

UPDATE "PlanConfig" SET
  "priceMinorUnits" = 199900,
  "features" = ARRAY['100 image credits', 'Up to 20 images per batch', 'Premium studio backgrounds', 'Re-processing included'],
  "purchasable" = true, "updatedAt" = CURRENT_TIMESTAMP
  WHERE "planKey" = 'STUDIO_PLUS';
UPDATE "PlanConfig" SET
  "priceMinorUnits" = 549900, "includedImages" = 400,
  "features" = ARRAY['400 images each month', 'Priority batch processing', 'Increased storage', 'Team-ready inventory workflow'],
  "purchasable" = true, "updatedAt" = CURRENT_TIMESTAMP
  WHERE "planKey" = 'STUDIO_PRO';
