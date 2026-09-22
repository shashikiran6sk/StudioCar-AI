ALTER TABLE "Vehicle"
ADD COLUMN "creationIdempotencyKey" VARCHAR(128);

CREATE UNIQUE INDEX "Vehicle_userId_creationIdempotencyKey_key"
ON "Vehicle"("userId", "creationIdempotencyKey");
