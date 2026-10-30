-- Storage is not a limit a customer works against: Free allows 15 images in
-- total, so "3 GB storage" and "Increased storage" told them nothing. Each
-- pack's storage line is replaced with a benefit the product delivers.
--
-- Only a feature list still exactly as seeded is changed. A list an
-- administrator has edited is theirs and is left alone.

UPDATE "PlanConfig"
SET
    "features" = ARRAY[
        '15 images in total',
        'Maximum 5 images per batch',
        'Standard background processing',
        'Originals always preserved'
    ]::TEXT[],
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "planKey" = 'FREE'
  AND "features" = ARRAY[
        '15 images in total',
        'Maximum 5 images per batch',
        'Standard background processing',
        '3 GB storage'
    ]::TEXT[];

UPDATE "PlanConfig"
SET
    "features" = ARRAY[
        '500 images each month',
        'Priority batch processing',
        'High-resolution output',
        'Team-ready inventory workflow'
    ]::TEXT[],
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "planKey" = 'STUDIO_PRO'
  AND "features" = ARRAY[
        '500 images each month',
        'Priority batch processing',
        'Increased storage',
        'Team-ready inventory workflow'
    ]::TEXT[];
