ALTER TABLE "PlanConfig" ADD CONSTRAINT "PlanConfig_free_product"
  CHECK ("planKey" <> 'FREE' OR ("priceMinorUnits" = 0 AND "billingInterval" = 'NONE' AND NOT "purchasable"));
