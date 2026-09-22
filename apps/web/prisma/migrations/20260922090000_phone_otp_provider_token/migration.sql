-- The browser widget now verifies the OTP and returns a signed access token.
-- Claiming a hash of that token makes it single use across challenges: a replay
-- against a second challenge collides on this unique index and is refused.
ALTER TABLE "PhoneOtpChallenge" ADD COLUMN "providerTokenHash" CHAR(64);

CREATE UNIQUE INDEX "PhoneOtpChallenge_providerTokenHash_key"
  ON "PhoneOtpChallenge"("providerTokenHash");
