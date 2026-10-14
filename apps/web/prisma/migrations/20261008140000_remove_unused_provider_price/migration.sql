-- Preserve unexpected provider configuration for explicit review before dropping it.
BEGIN;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM "PlanConfig" WHERE "providerPriceId" IS NOT NULL)
    THEN RAISE EXCEPTION 'Historical provider pricing identifiers found: export/review them before cleanup'; END IF;
END $$;
ALTER TABLE "PlanConfig" DROP COLUMN "providerPriceId";
COMMIT;
