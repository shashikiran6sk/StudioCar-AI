import { z } from "zod";

export const BackgroundTreatmentSchema = z.enum([
  "PREMIUM_WHITE",
  "DARK_STUDIO",
  "GREY_STUDIO",
  "DEALERSHIP",
  "CUSTOM",
]);

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
