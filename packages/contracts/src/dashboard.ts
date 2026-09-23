import { z } from "zod";

import { EntityIdSchema } from "./common";
import { InventoryItemSchema } from "./inventory";

/**
 * Vehicles whose newest processing batch ended with images the user has to
 * act on. `vehicleId` names the vehicle when it is the only one, so the
 * dashboard can open it directly.
 */
export const DashboardAttentionSchema = z
  .object({
    vehicleCount: z.number().int().nonnegative(),
    vehicleId: EntityIdSchema.nullable(),
  })
  .strict();

export const DashboardSummarySchema = z
  .object({
    activeImageCount: z.number().int().nonnegative(),
    attention: DashboardAttentionSchema,
    imagesProcessed: z.number().int().nonnegative(),
    imagesProcessedThisPeriod: z.number().int().nonnegative(),
    imagesRemaining: z.number().int().nonnegative(),
    planName: z.string().min(1).max(80),
    processingSuccessRate: z.number().min(0).max(100).nullable(),
    recentVehicles: z.array(InventoryItemSchema).max(3),
    storageCapacityBytes: z.number().int().nonnegative(),
    storageUsedBytes: z.number().int().nonnegative(),
    vehiclesProcessed: z.number().int().nonnegative(),
    vehiclesProcessedThisPeriod: z.number().int().nonnegative(),
    vehiclesProcessing: z.number().int().nonnegative(),
  })
  .strict();

export type DashboardAttention = z.infer<typeof DashboardAttentionSchema>;
export type DashboardSummary = z.infer<typeof DashboardSummarySchema>;
