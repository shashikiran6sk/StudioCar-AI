import { z } from "zod";

import { EntityIdSchema, IsoDateTimeSchema } from "./common";
import {
  ProcessingBatchLabelSchema,
  ProcessingFailureReasonSchema,
} from "./jobs";
import { ProcessingOptionsSchema } from "./processing";

/**
 * Every version a vehicle's job history can hold stays reachable: a vehicle
 * tested across the whole treatment matrix has 96 of them.
 */
export const MAX_PORTFOLIO_VERSIONS = 120;
export const MAX_PORTFOLIO_VERSION_IMAGES = 100;
export const MAX_PORTFOLIO_ATTENTION_IMAGES = 20;

export const PortfolioStatusSchema = z.enum([
  "PROCESSING",
  "COMPLETED",
  "NEEDS_ATTENTION",
  "ARCHIVED",
]);

/** A studio version's key: the SHA-256 of its canonical options and label. */
export const PortfolioVersionIdSchema = z
  .string()
  .regex(/^[0-9a-f]{64}$/, "A studio version ID is a SHA-256 hex digest.");

export const PortfolioImageSchema = z
  .object({
    id: EntityIdSchema,
    displayOrder: z.number().int().nonnegative(),
    originalFilename: z.string().trim().min(1).max(255),
    originalUrl: z.url(),
    processedUrl: z.url(),
    previewUrl: z.url(),
    downloadUrl: z.url(),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  })
  .strict();

/**
 * Every completed image made with one treatment and label. Creating another
 * version with a different background, floor or label adds a version; it
 * never replaces one.
 */
export const PortfolioVersionSchema = z
  .object({
    id: PortfolioVersionIdSchema,
    options: ProcessingOptionsSchema,
    /** The name given to the batches that made it, when they had one. */
    label: ProcessingBatchLabelSchema.nullable(),
    imageCount: z.number().int().positive(),
    completedAt: IsoDateTimeSchema,
  })
  .strict();

export const PortfolioFailedImageSchema = z
  .object({
    jobId: EntityIdSchema,
    assetId: EntityIdSchema,
    displayOrder: z.number().int().nonnegative(),
    originalFilename: z.string().trim().min(1).max(255),
    originalUrl: z.url(),
    reason: ProcessingFailureReasonSchema,
    /** The original cannot be processed at all; only a new photo fixes it. */
    replaceRequired: z.boolean(),
  })
  .strict();

/** The newest batch, when it ended with images the user has to act on. */
export const PortfolioAttentionSchema = z
  .object({
    options: ProcessingOptionsSchema,
    imageCount: z.number().int().positive(),
    failedImages: z
      .array(PortfolioFailedImageSchema)
      .min(1)
      .max(MAX_PORTFOLIO_ATTENTION_IMAGES),
  })
  .strict();

export const VehiclePortfolioSchema = z
  .object({
    id: EntityIdSchema,
    name: z.string().trim().min(1).max(120),
    brand: z.string().trim().max(80).nullable(),
    model: z.string().trim().max(80).nullable(),
    variant: z.string().trim().max(80).nullable(),
    year: z.number().int().nullable(),
    stockId: z.string().trim().max(80).nullable(),
    status: PortfolioStatusSchema,
    /** Whether a new studio version can be started now. */
    canCreateVersion: z.boolean(),
    versions: z.array(PortfolioVersionSchema).max(MAX_PORTFOLIO_VERSIONS),
    selectedVersionId: PortfolioVersionIdSchema.nullable(),
    /** The completed images of the selected version. */
    images: z.array(PortfolioImageSchema).max(MAX_PORTFOLIO_VERSION_IMAGES),
    attention: PortfolioAttentionSchema.nullable(),
  })
  .strict();

export type PortfolioStatus = z.infer<typeof PortfolioStatusSchema>;
export type PortfolioImage = z.infer<typeof PortfolioImageSchema>;
export type PortfolioVersion = z.infer<typeof PortfolioVersionSchema>;
export type PortfolioFailedImage = z.infer<typeof PortfolioFailedImageSchema>;
export type PortfolioAttention = z.infer<typeof PortfolioAttentionSchema>;
export type VehiclePortfolio = z.infer<typeof VehiclePortfolioSchema>;
