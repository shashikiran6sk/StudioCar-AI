-- Outbound email delivery is removed. These objects were created only by
-- 20260920130000_email_delivery_outbox and nothing else references them.
-- Email addresses used for identity (User.primaryEmail, AuthIdentity.email,
-- AdminInvite.email) are unaffected.

-- DropForeignKey
ALTER TABLE "EmailOutboxMessage" DROP CONSTRAINT "EmailOutboxMessage_userId_fkey";

-- DropForeignKey
ALTER TABLE "EmailOutboxMessage" DROP CONSTRAINT "EmailOutboxMessage_vehicleId_fkey";

-- DropTable (also drops its primary key and indexes)
DROP TABLE "EmailOutboxMessage";

-- DropEnum
DROP TYPE "EmailDeliveryStatus";

-- DropEnum
DROP TYPE "EmailMessageType";
