-- The monthly Studio Plus plan is retired and the Studio Pack credit pack
-- takes its name. The key is reused, so the retired plan's rows must move out
-- of the way before the rename, or the new Studio Plus would inherit them.

-- 1. A subscription to the retired plan ends now, and its account returns to
--    Free. It keeps its own history under a key no plan describes, which the
--    application already resolves to Free.
UPDATE "PlanSubscription"
SET
    "status" = CASE
        WHEN "status" IN ('TRIALING', 'ACTIVE', 'PAST_DUE')
            THEN 'EXPIRED'::"SubscriptionStatus"
        ELSE "status"
    END,
    "planKey" = 'RETIRED_STUDIO_PLUS',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "planKey" = 'STUDIO_PLUS';

DELETE FROM "PlanConfig" WHERE "planKey" = 'STUDIO_PLUS';

-- 2. Studio Pack becomes Studio Plus. A display name an administrator has
--    already changed is theirs and is left alone.
UPDATE "PlanConfig"
SET
    "planKey" = 'STUDIO_PLUS',
    "displayName" = CASE
        WHEN "displayName" = 'Studio Pack' THEN 'Studio Plus'
        ELSE "displayName"
    END,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "planKey" = 'STUDIO_PACK';

UPDATE "PlanSubscription"
SET "planKey" = 'STUDIO_PLUS', "updatedAt" = CURRENT_TIMESTAMP
WHERE "planKey" = 'STUDIO_PACK';
