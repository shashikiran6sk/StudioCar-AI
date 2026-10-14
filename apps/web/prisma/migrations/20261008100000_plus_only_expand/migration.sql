-- Deploy before rolling the Plus-only web and worker release.
-- The new client omits legacy allocation source; the old client still supplies it.
ALTER TABLE "CreditAllocation" ALTER COLUMN "source" SET DEFAULT 'PURCHASED';
UPDATE "PlanConfig" SET "displayName" = 'StudioCar Plus', "priceMinorUnits" = 199900,
  "includedImages" = 100, "billingInterval" = 'ONE_TIME', "allowanceScope" = 'LIFETIME',
  "features" = ARRAY['100 image credits', 'Up to 20 images per batch', 'Premium studio backgrounds', 'Credits never expire', 'Buy additional credits at any time'],
  "updatedAt" = CURRENT_TIMESTAMP WHERE "planKey" = 'STUDIO_PLUS';
