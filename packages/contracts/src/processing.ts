import { z } from "zod";

/** The studio backgrounds a vehicle can be placed in. */
export const StudioBackgroundIdSchema = z.enum([
  "PREMIUM_WHITE",
  "DARK_STUDIO",
  "GREY_STUDIO",
]);

/** The floors that belong to Premium White. */
export const PremiumWhiteFloorIdSchema = z.enum([
  "WHITE_STUDIO",
  "WHITE_TURNTABLE",
]);

/** The floors that belong to Dark Studio. */
export const DarkStudioFloorIdSchema = z.enum([
  "DARK_STUDIO_FLOOR",
  "DARK_TURNTABLE",
]);

/** The floors that belong to Grey Studio. */
export const GreyStudioFloorIdSchema = z.enum([
  "GREY_STUDIO_FLOOR",
  "GREY_TURNTABLE",
]);

/**
 * Every floor treatment. A floor is either a flat studio floor or a turntable,
 * and each belongs to exactly one background.
 */
export const StudioFloorIdSchema = z.enum([
  ...PremiumWhiteFloorIdSchema.options,
  ...DarkStudioFloorIdSchema.options,
  ...GreyStudioFloorIdSchema.options,
]);

/**
 * `ORIGINAL` keeps the photographed background: no background removal, no
 * studio, and therefore no floor.
 */
export const OriginalBackgroundIdSchema = z.literal("ORIGINAL");

export const BackgroundIdSchema = z.enum([
  OriginalBackgroundIdSchema.value,
  ...StudioBackgroundIdSchema.options,
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

/** Every processing setting except the background and its floor. */
export const ProcessingSettingsSchema = z.object({
  enhancement: z.boolean().default(true),
  platePrivacy: z.boolean().default(true),
  shadow: ShadowTreatmentSchema.default("NATURAL"),
  crop: CropModeSchema.default("MAINTAIN_COMPOSITION"),
  paddingPercent: z.number().int().min(0).max(40).default(8),
  outputFormat: OutputFormatSchema.default("JPEG"),
  quality: z.number().int().min(60).max(100).default(90),
});

const PremiumWhiteTreatmentShape = {
  backgroundId: z.literal(StudioBackgroundIdSchema.enum.PREMIUM_WHITE),
  floorId: PremiumWhiteFloorIdSchema,
};
const DarkStudioTreatmentShape = {
  backgroundId: z.literal(StudioBackgroundIdSchema.enum.DARK_STUDIO),
  floorId: DarkStudioFloorIdSchema,
};
const GreyStudioTreatmentShape = {
  backgroundId: z.literal(StudioBackgroundIdSchema.enum.GREY_STUDIO),
  floorId: GreyStudioFloorIdSchema,
};

/**
 * A studio background together with one of its own floors. The pairing is
 * part of the type: a floor from another background does not parse.
 */
export const StudioTreatmentSchema = z.discriminatedUnion("backgroundId", [
  z.object(PremiumWhiteTreatmentShape).strict(),
  z.object(DarkStudioTreatmentShape).strict(),
  z.object(GreyStudioTreatmentShape).strict(),
]);

/**
 * What the worker is asked to do with one image. Only semantic IDs cross this
 * boundary; where a background or floor is stored is the worker's concern.
 */
export const ProcessingOptionsSchema = z.discriminatedUnion("backgroundId", [
  ProcessingSettingsSchema.extend({
    backgroundId: OriginalBackgroundIdSchema,
  }).strict(),
  ProcessingSettingsSchema.extend(PremiumWhiteTreatmentShape).strict(),
  ProcessingSettingsSchema.extend(DarkStudioTreatmentShape).strict(),
  ProcessingSettingsSchema.extend(GreyStudioTreatmentShape).strict(),
]);

/** The floors each studio background offers, in the order they are shown. */
export const STUDIO_FLOOR_IDS_BY_BACKGROUND = {
  PREMIUM_WHITE: PremiumWhiteFloorIdSchema.options,
  DARK_STUDIO: DarkStudioFloorIdSchema.options,
  GREY_STUDIO: GreyStudioFloorIdSchema.options,
} satisfies Record<
  z.infer<typeof StudioBackgroundIdSchema>,
  readonly z.infer<typeof StudioFloorIdSchema>[]
>;

export type ProcessingOptions = z.infer<typeof ProcessingOptionsSchema>;
export type ProcessingSettings = z.infer<typeof ProcessingSettingsSchema>;
export type BackgroundId = z.infer<typeof BackgroundIdSchema>;
export type StudioBackgroundId = z.infer<typeof StudioBackgroundIdSchema>;
export type StudioFloorId = z.infer<typeof StudioFloorIdSchema>;
export type StudioTreatment = z.infer<typeof StudioTreatmentSchema>;
export type CropMode = z.infer<typeof CropModeSchema>;
export type ShadowTreatment = z.infer<typeof ShadowTreatmentSchema>;
