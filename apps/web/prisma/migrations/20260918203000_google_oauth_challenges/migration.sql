-- CreateTable
CREATE TABLE "OAuthChallenge" (
    "id" UUID NOT NULL,
    "provider" "AuthProvider" NOT NULL,
    "stateHash" CHAR(64) NOT NULL,
    "protectedPayload" TEXT NOT NULL,
    "returnTo" VARCHAR(2048) NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "consumedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OAuthChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OAuthChallenge_stateHash_key" ON "OAuthChallenge"("stateHash");

-- CreateIndex
CREATE INDEX "OAuthChallenge_provider_expiresAt_consumedAt_idx" ON "OAuthChallenge"("provider", "expiresAt", "consumedAt");
