-- Add a nullable upload idempotency key so existing image assets remain valid
-- while repeated upload-intent requests resolve to the same pending asset.
ALTER TABLE "ImageAsset"
ADD COLUMN "idempotencyKey" VARCHAR(128);

CREATE UNIQUE INDEX "ImageAsset_userId_idempotencyKey_key"
ON "ImageAsset"("userId", "idempotencyKey");
