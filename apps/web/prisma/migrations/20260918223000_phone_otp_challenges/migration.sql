CREATE TYPE "PhoneOtpAttemptOutcome" AS ENUM (
  'PENDING',
  'INVALID',
  'EXPIRED',
  'PROVIDER_VERIFIED',
  'AUTHENTICATED',
  'PROVIDER_ERROR'
);

CREATE TABLE "PhoneOtpChallenge" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "phoneNumber" VARCHAR(20) NOT NULL,
  "phoneHash" CHAR(64) NOT NULL,
  "browserBindingHash" CHAR(64) NOT NULL,
  "sendRequestIpHash" CHAR(64) NOT NULL,
  "providerRequestId" VARCHAR(255),
  "verificationAttempts" INTEGER NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMPTZ(3) NOT NULL,
  "sentAt" TIMESTAMPTZ(3),
  "providerVerifiedAt" TIMESTAMPTZ(3),
  "consumedAt" TIMESTAMPTZ(3),
  "failedAt" TIMESTAMPTZ(3),
  "failureCode" VARCHAR(80),
  "sessionId" UUID,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "PhoneOtpChallenge_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PhoneOtpAttempt" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "challengeId" UUID NOT NULL,
  "requestIpHash" CHAR(64) NOT NULL,
  "outcome" "PhoneOtpAttemptOutcome" NOT NULL DEFAULT 'PENDING',
  "completedAt" TIMESTAMPTZ(3),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PhoneOtpAttempt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PhoneOtpChallenge_sessionId_key" ON "PhoneOtpChallenge"("sessionId");
CREATE INDEX "PhoneOtpChallenge_phoneHash_createdAt_idx" ON "PhoneOtpChallenge"("phoneHash", "createdAt");
CREATE INDEX "PhoneOtpChallenge_sendRequestIpHash_createdAt_idx" ON "PhoneOtpChallenge"("sendRequestIpHash", "createdAt");
CREATE INDEX "PhoneOtpChallenge_expiresAt_consumedAt_idx" ON "PhoneOtpChallenge"("expiresAt", "consumedAt");
CREATE INDEX "PhoneOtpAttempt_challengeId_createdAt_idx" ON "PhoneOtpAttempt"("challengeId", "createdAt");
CREATE INDEX "PhoneOtpAttempt_requestIpHash_createdAt_idx" ON "PhoneOtpAttempt"("requestIpHash", "createdAt");

ALTER TABLE "PhoneOtpChallenge"
  ADD CONSTRAINT "PhoneOtpChallenge_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PhoneOtpAttempt"
  ADD CONSTRAINT "PhoneOtpAttempt_challengeId_fkey"
  FOREIGN KEY ("challengeId") REFERENCES "PhoneOtpChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
