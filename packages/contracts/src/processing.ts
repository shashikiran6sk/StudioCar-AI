import { z } from "zod";

export const BackgroundTreatmentSchema = z.enum([
  "ORIGINAL",
  "PREMIUM_WHITE",
  "DARK_STUDIO",
  "GREY_STUDIO",
]);

/**
 * What a studio background stands the vehicle on.
 *
 * `PLAIN` is the background colour alone, with no floor. `HORIZON` is the
 * standard floor: a flat floor meeting the wall at a straight line, as on the
 * homepage.
 */
export const FloorStyleSchema = z.enum(["PLAIN", "HORIZON"]);

export const CropModeSchema = z.enum([
  "MAINTAIN_COMPOSITION",
  "FIT_VEHICLE",
  "SQUARE",
]);

/**
 * The composition every original-photo treatment uses. Without a studio
 * background there is no cutout to trim or re-frame, so the photo keeps its
 * own frame.
 */
export const ORIGINAL_BACKGROUND_CROP_MODE = "MAINTAIN_COMPOSITION";

const ProcessingOptionsShape = {
  background: BackgroundTreatmentSchema.default("PREMIUM_WHITE"),
  floor: FloorStyleSchema.default("HORIZON"),
  enhancement: z.boolean().default(true),
  crop: CropModeSchema.default("MAINTAIN_COMPOSITION"),
  paddingPercent: z.number().int().min(0).max(40).default(8),
  quality: z.number().int().min(60).max(100).default(90),
};

/**
 * The treatment a person asks for. The vehicle cutout and its ground shadow
 * always come from the background-removal provider, and every output is WebP,
 * so neither is a choice here. Resolution is never a request field either: it
 * follows the account's plan on the server.
 */
export const ProcessingOptionsSchema = z
  .object(ProcessingOptionsShape)
  .strict()
  .refine(
    (options) =>
      options.background !== "ORIGINAL" ||
      options.crop === ORIGINAL_BACKGROUND_CROP_MODE,
    {
      message:
        "An original-photo treatment keeps the photo's own composition.",
      path: ["crop"],
    },
  );

/**
 * Options as they were stored on a job, including batches made before the
 * treatment contract dropped number-plate masking, the local shadow choice and
 * the output format. Those keys are accepted and discarded, and an
 * original-photo job is read with the only composition it can now have, so
 * every stored treatment reads as one a person could ask for today.
 */
export const StoredProcessingOptionsSchema = z
  .object({
    ...ProcessingOptionsShape,
    /** @deprecated Never applied by any worker; removed from requests. */
    platePrivacy: z.boolean().optional(),
    /** @deprecated The provider now draws the ground shadow. */
    shadow: z.enum(["NONE", "NATURAL", "STUDIO"]).optional(),
    /** @deprecated Every output is WebP. */
    outputFormat: z.enum(["JPEG", "PNG", "WEBP"]).optional(),
  })
  .strict()
  .transform(
    (stored): ProcessingOptions => ({
      background: stored.background,
      crop:
        stored.background === "ORIGINAL"
          ? ORIGINAL_BACKGROUND_CROP_MODE
          : stored.crop,
      enhancement: stored.enhancement,
      floor: stored.floor,
      paddingPercent: stored.paddingPercent,
      quality: stored.quality,
    }),
  );

export type ProcessingOptions = z.infer<typeof ProcessingOptionsSchema>;
export type BackgroundTreatment = z.infer<typeof BackgroundTreatmentSchema>;
export type FloorStyle = z.infer<typeof FloorStyleSchema>;
export type CropMode = z.infer<typeof CropModeSchema>;
