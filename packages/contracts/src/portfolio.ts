import { z } from "zod";

import { EntityIdSchema, IsoDateTimeSchema } from "./common";
import { ProcessingOptionsSchema } from "./processing";

export const PortfolioStatusSchema = z.enum([
  "COMPLETED",
  "NEEDS_ATTENTION",
  "ARCHIVED",
]);

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
    completedAt: IsoDateTimeSchema,
    options: ProcessingOptionsSchema,
    images: z.array(PortfolioImageSchema).min(1).max(20),
  })
  .strict();

export type PortfolioStatus = z.infer<typeof PortfolioStatusSchema>;
export type PortfolioImage = z.infer<typeof PortfolioImageSchema>;
export type VehiclePortfolio = z.infer<typeof VehiclePortfolioSchema>;
