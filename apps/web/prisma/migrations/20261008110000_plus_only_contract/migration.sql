-- Contract only after all old web instances and workers have drained.
-- Fresh databases have no users and can apply the full migration chain directly.
BEGIN;
SET LOCAL lock_timeout = '5s';
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "User") AND NOT EXISTS (
    SELECT 1 FROM "AppConfig" WHERE "key" = 'billing.plus-only.rollout-drained' AND "value" = 'true'::jsonb
  ) THEN RAISE EXCEPTION 'Drain old web and worker instances before Plus-only contraction; see docs/razorpay-billing.md'; END IF;
  IF EXISTS (SELECT 1 FROM "PlanSubscription") OR EXISTS (SELECT 1 FROM "SubscriptionAllowance")
    OR EXISTS (SELECT 1 FROM "CreditAllocation" WHERE "source" <> 'PURCHASED' OR "allowanceId" IS NOT NULL)
    OR EXISTS (SELECT 1 FROM "Payment" WHERE "subscriptionId" IS NOT NULL OR "planPriceId" IS NOT NULL
      OR "razorpaySubscriptionId" IS NOT NULL OR "billingType" <> 'ONE_TIME' OR "productCode" <> 'STUDIO_PLUS')
    OR EXISTS (SELECT 1 FROM "PlanConfig" WHERE "planKey" <> 'STUDIO_PRO'
      AND ("billingInterval" = 'MONTHLY' OR "allowanceScope" = 'BILLING_PERIOD'))
  THEN RAISE EXCEPTION 'Subscription history found: STOP and preserve/reconcile data; no historical payments may be dropped'; END IF;
END $$;
DELETE FROM "PlanConfig" WHERE "planKey" = 'STUDIO_PRO';
-- AlterEnum
CREATE TYPE "PlanBillingInterval_new" AS ENUM ('NONE', 'ONE_TIME');
ALTER TABLE "PlanConfig" ALTER COLUMN "billingInterval" TYPE "PlanBillingInterval_new" USING ("billingInterval"::text::"PlanBillingInterval_new");
ALTER TABLE "Payment" ALTER COLUMN "billingType" TYPE "PlanBillingInterval_new" USING ("billingType"::text::"PlanBillingInterval_new");
ALTER TYPE "PlanBillingInterval" RENAME TO "PlanBillingInterval_old";
ALTER TYPE "PlanBillingInterval_new" RENAME TO "PlanBillingInterval";
DROP TYPE "PlanBillingInterval_old";

-- AlterEnum
CREATE TYPE "PlanAllowanceScope_new" AS ENUM ('LIFETIME');
ALTER TABLE "PlanConfig" ALTER COLUMN "allowanceScope" TYPE "PlanAllowanceScope_new" USING ("allowanceScope"::text::"PlanAllowanceScope_new");
ALTER TYPE "PlanAllowanceScope" RENAME TO "PlanAllowanceScope_old";
ALTER TYPE "PlanAllowanceScope_new" RENAME TO "PlanAllowanceScope";
DROP TYPE "PlanAllowanceScope_old";

-- DropForeignKey
ALTER TABLE "PlanPrice" DROP CONSTRAINT "PlanPrice_planConfigId_fkey";

-- DropForeignKey
ALTER TABLE "PlanSubscription" DROP CONSTRAINT "PlanSubscription_userId_fkey";

-- DropForeignKey
ALTER TABLE "PlanSubscription" DROP CONSTRAINT "PlanSubscription_assignedByUserId_fkey";

-- DropForeignKey
ALTER TABLE "PlanSubscription" DROP CONSTRAINT "PlanSubscription_planPriceId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_planPriceId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_subscriptionId_fkey";

-- DropForeignKey
ALTER TABLE "SubscriptionAllowance" DROP CONSTRAINT "SubscriptionAllowance_userId_fkey";

-- DropForeignKey
ALTER TABLE "SubscriptionAllowance" DROP CONSTRAINT "SubscriptionAllowance_subscriptionId_fkey";

-- DropForeignKey
ALTER TABLE "CreditAllocation" DROP CONSTRAINT "CreditAllocation_allowanceId_fkey";

-- DropIndex
DROP INDEX "Payment_razorpaySubscriptionId_idx";

-- DropIndex
DROP INDEX "CreditAllocation_userId_source_status_idx";

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "planPriceId",
DROP COLUMN "razorpaySubscriptionId",
DROP COLUMN "subscriptionId";

-- AlterTable
ALTER TABLE "CreditAllocation" DROP COLUMN "allowanceId",
DROP COLUMN "source";

-- DropTable
DROP TABLE "PlanPrice";

-- DropTable
DROP TABLE "PlanSubscription";

-- DropTable
DROP TABLE "SubscriptionAllowance";

-- DropEnum
DROP TYPE "SubscriptionStatus";

-- DropEnum
DROP TYPE "CreditAllocationSource";

-- DropEnum
DROP TYPE "SubscriptionSource";

-- CreateIndex
CREATE INDEX "CreditAllocation_userId_status_idx" ON "CreditAllocation"("userId", "status");


ALTER TABLE "Payment" ADD CONSTRAINT "Payment_plus_product"
  CHECK ("productCode" = 'STUDIO_PLUS' AND "billingType" = 'ONE_TIME'
    AND "amountPaise" = 199900 AND "currency" = 'INR' AND "includedImages" = 100);
ALTER TABLE "PlanConfig" ADD CONSTRAINT "PlanConfig_plus_product"
  CHECK ("planKey" <> 'STUDIO_PLUS' OR ("priceMinorUnits" = 199900 AND "includedImages" = 100
    AND "currency" = 'INR' AND "billingInterval" = 'ONE_TIME' AND "allowanceScope" = 'LIFETIME'));
DELETE FROM "AppConfig" WHERE "key" = 'billing.plus-only.rollout-drained';
COMMIT;
