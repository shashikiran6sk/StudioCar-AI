import { z } from "zod";

export const BackgroundTreatmentSchema = z.enum([
  "ORIGINAL",
  "PREMIUM_WHITE",
  "DARK_STUDIO",
  "GREY_STUDIO",
  "DEALERSHIP",
  "CUSTOM",
]);

/**
 * The floor a studio background stands the vehicle on.
 *
 * `HORIZON` is a flat floor meeting the wall at a straight line, as on the
 * homepage. `TURNTABLE` is a round display platform seen in perspective, as
 * used by car marketplaces.
 */
export const FloorStyleSchema = z.enum(["HORIZON", "TURNTABLE"]);

export const ShadowTreatmentSchema = z.enum([
  "NONE",
  "NATURAL",
  "STUDIO",
]);

export const CropModeSchema = z.enum([
  "MAINTAIN_COMPOSITION",
  "FIT_VEHICLE",
  "SQUARE",
]);

export const OutputFormatSchema = z.enum(["JPEG", "PNG", "WEBP"]);

export const ProcessingOptionsSchema = z
  .object({
    background: BackgroundTreatmentSchema.default("PREMIUM_WHITE"),
    floor: FloorStyleSchema.default("HORIZON"),
    enhancement: z.boolean().default(true),
    platePrivacy: z.boolean().default(true),
    shadow: ShadowTreatmentSchema.default("NATURAL"),
    crop: CropModeSchema.default("MAINTAIN_COMPOSITION"),
    paddingPercent: z.number().int().min(0).max(40).default(8),
    outputFormat: OutputFormatSchema.default("JPEG"),
    quality: z.number().int().min(60).max(100).default(90),
    customBackgroundAssetId: z.uuid().optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.background === "CUSTOM" && !value.customBackgroundAssetId) {
      context.addIssue({
        code: "custom",
        message: "A custom background asset is required.",
        path: ["customBackgroundAssetId"],
      });
    }

    if (value.background !== "CUSTOM" && value.customBackgroundAssetId) {
      context.addIssue({
        code: "custom",
        message: "A custom background asset is only valid for CUSTOM treatment.",
        path: ["customBackgroundAssetId"],
      });
    }
  });

export type ProcessingOptions = z.infer<typeof ProcessingOptionsSchema>;
export type BackgroundTreatment = z.infer<typeof BackgroundTreatmentSchema>;
export type FloorStyle = z.infer<typeof FloorStyleSchema>;
export type CropMode = z.infer<typeof CropModeSchema>;
export type ShadowTreatment = z.infer<typeof ShadowTreatmentSchema>;
