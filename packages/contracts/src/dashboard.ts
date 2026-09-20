import { z } from "zod";

import { InventoryItemSchema } from "./inventory";

export const DashboardSummarySchema = z
  .object({
    activeImageCount: z.number().int().nonnegative(),
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

export type DashboardSummary = z.infer<typeof DashboardSummarySchema>;
