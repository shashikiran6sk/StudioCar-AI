-- Pack features now list only what the product delivers. Every plan gets the
-- same backgrounds and processing; plans differ by allowance, batch size and
-- output resolution (Free: preview; Studio Plus and Studio Pro: high).
-- "Premium studio backgrounds", "Standard background processing",
-- "Priority batch processing", "Re-processing included" and "Team-ready
-- inventory workflow" described nothing that exists.
--
-- Only a list still exactly as seeded, before or after the storage lines were
-- removed, is changed. A list an administrator has edited is left alone.

UPDATE "PlanConfig"
SET
    "features" = ARRAY[
        '15 images in total',
        'Up to 5 images per batch',
        'Preview-resolution results'
    ]::TEXT[],
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "planKey" = 'FREE'
  AND "features" IN (
        ARRAY[
            '15 images in total',
            'Maximum 5 images per batch',
            'Standard background processing',
            'Originals always preserved'
        ]::TEXT[],
        ARRAY[
            '15 images in total',
            'Maximum 5 images per batch',
            'Standard background processing',
            '3 GB storage'
        ]::TEXT[]
    );

UPDATE "PlanConfig"
SET
    "features" = ARRAY[
        '100 images in total',
        'Up to 20 images per batch',
        'High-resolution results'
    ]::TEXT[],
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "planKey" = 'STUDIO_PLUS'
  AND "features" = ARRAY[
        '100 image credits',
        'Up to 20 images per batch',
        'Premium studio backgrounds',
        'Re-processing included'
    ]::TEXT[];

UPDATE "PlanConfig"
SET
    "features" = ARRAY[
        '500 images each month',
        'Up to 20 images per batch',
        'High-resolution results'
    ]::TEXT[],
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "planKey" = 'STUDIO_PRO'
  AND "features" IN (
        ARRAY[
            '500 images each month',
            'Priority batch processing',
            'High-resolution output',
            'Team-ready inventory workflow'
        ]::TEXT[],
        ARRAY[
            '500 images each month',
            'Priority batch processing',
            'Increased storage',
            'Team-ready inventory workflow'
        ]::TEXT[]
    );
