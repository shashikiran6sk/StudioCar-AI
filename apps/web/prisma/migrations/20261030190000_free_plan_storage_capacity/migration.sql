-- Storage is never enforced, so Free's 3 GB capacity only produced
-- "of 3.0 GB" in the sidebar, dashboard and Usage & Billing without ever
-- limiting anything. Free now sets no capacity, like the paid plans.
--
-- Only the seeded 3 GiB is cleared. A capacity an administrator has chosen is
-- theirs and is left alone.

UPDATE "PlanConfig"
SET
    "storageBytes" = NULL,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "planKey" = 'FREE'
  AND "storageBytes" = 3221225472;
