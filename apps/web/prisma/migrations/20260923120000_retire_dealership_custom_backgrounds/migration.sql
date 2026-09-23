-- Dealership and Custom backgrounds are retired.
--
-- A stored job that asked for either is recorded as Premium White, the
-- closest remaining background, so its options still parse. Its stored image
-- is not changed. StudioCar AI has not been deployed, so only development
-- data is affected.
UPDATE "ProcessingJob"
SET "options" = jsonb_set(
  "options" - 'customBackgroundAssetId',
  '{background}',
  '"PREMIUM_WHITE"'
)
WHERE "options"->>'background' IN ('DEALERSHIP', 'CUSTOM');
