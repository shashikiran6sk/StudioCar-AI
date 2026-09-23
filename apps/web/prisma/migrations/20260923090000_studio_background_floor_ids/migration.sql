-- Studio background and floor IDs.
--
-- Processing options now name a background with `backgroundId` and, for a
-- studio background, one of that background's own floors with `floorId`.
-- Dealership and Custom backgrounds are retired.
--
-- Earlier options were stored without their floor, so every studio job was
-- rendered on the standard floor; that is what `floorId` records for them. The
-- rare Dealership or Custom row is recorded as Premium White on its standard
-- floor, the closest remaining treatment. Its stored image is not changed.
-- StudioCar AI has not been deployed, so only development data is affected.
UPDATE "ProcessingJob"
SET "options" = ("options" - 'background' - 'floor' - 'customBackgroundAssetId')
  || CASE "options"->>'background'
    WHEN 'ORIGINAL' THEN jsonb_build_object('backgroundId', 'ORIGINAL')
    WHEN 'DARK_STUDIO' THEN jsonb_build_object(
      'backgroundId', 'DARK_STUDIO',
      'floorId', CASE WHEN "options"->>'floor' = 'TURNTABLE'
        THEN 'DARK_TURNTABLE' ELSE 'DARK_STUDIO_FLOOR' END)
    WHEN 'GREY_STUDIO' THEN jsonb_build_object(
      'backgroundId', 'GREY_STUDIO',
      'floorId', CASE WHEN "options"->>'floor' = 'TURNTABLE'
        THEN 'GREY_TURNTABLE' ELSE 'GREY_STUDIO_FLOOR' END)
    ELSE jsonb_build_object(
      'backgroundId', 'PREMIUM_WHITE',
      'floorId', CASE WHEN "options"->>'background' = 'PREMIUM_WHITE'
          AND "options"->>'floor' = 'TURNTABLE'
        THEN 'WHITE_TURNTABLE' ELSE 'WHITE_STUDIO' END)
  END
WHERE NOT ("options" ? 'backgroundId');
