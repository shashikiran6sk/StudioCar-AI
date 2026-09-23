import { z } from "zod";

import { EntityIdSchema } from "./common";
import { ProcessingFailureReasonSchema } from "./jobs";
import { ProcessingOptionsSchema } from "./processing";

export const MAX_STUDIO_SELECTION_IMAGES = 40;

/**
 * How the Selection Dialog was opened. Every mode ends in the same processing
 * command; the mode only decides what the dialog starts with.
 */
export const StudioSelectionModeSchema = z.enum([
  "NEW_UPLOAD",
  "CREATE_VARIANT",
  "REPROCESS_FAILED",
  "REPLACE_FAILED",
]);

/** The modes that start from a vehicle that already exists. */
export const ExistingVehicleSelectionModeSchema = StudioSelectionModeSchema.exclude([
  "NEW_UPLOAD",
]);

export const StudioSelectionVehicleSchema = z
  .object({
    id: EntityIdSchema,
    name: z.string().trim().min(1).max(120),
    brand: z.string().trim().max(80).nullable(),
    model: z.string().trim().max(80).nullable(),
    variant: z.string().trim().max(80).nullable(),
    year: z.number().int().nullable(),
    stockId: z.string().trim().max(80).nullable(),
  })
  .strict();

export const StudioSelectionImageSchema = z
  .object({
    assetId: EntityIdSchema,
    displayOrder: z.number().int().nonnegative(),
    originalFilename: z.string().trim().min(1).max(255),
    previewUrl: z.url(),
    sizeBytes: z.number().int().nonnegative(),
    width: z.number().int().positive().nullable(),
    height: z.number().int().positive().nullable(),
    selected: z.boolean(),
    failureReason: ProcessingFailureReasonSchema.nullable(),
    replaceRequired: z.boolean(),
  })
  .strict();

export const StudioSelectionContextSchema = z
  .object({
    mode: ExistingVehicleSelectionModeSchema,
    vehicle: StudioSelectionVehicleSchema,
    options: ProcessingOptionsSchema,
    images: z
      .array(StudioSelectionImageSchema)
      .min(1)
      .max(MAX_STUDIO_SELECTION_IMAGES),
  })
  .strict();

export type StudioSelectionMode = z.infer<typeof StudioSelectionModeSchema>;
export type ExistingVehicleSelectionMode = z.infer<
  typeof ExistingVehicleSelectionModeSchema
>;
export type StudioSelectionVehicle = z.infer<typeof StudioSelectionVehicleSchema>;
export type StudioSelectionImage = z.infer<typeof StudioSelectionImageSchema>;
export type StudioSelectionContext = z.infer<typeof StudioSelectionContextSchema>;
