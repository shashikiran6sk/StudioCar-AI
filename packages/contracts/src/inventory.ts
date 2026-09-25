import { z } from "zod";

import {
  CursorPaginationSchema,
  EntityIdSchema,
  IsoDateTimeSchema,
} from "./common";
import { VehicleSortSchema } from "./vehicle";

export const InventoryFilterSchema = z.enum([
  "ALL",
  "PROCESSING",
  "COMPLETED",
  "NEEDS_ATTENTION",
  "ARCHIVED",
]);

/**
 * `BROWSE` is the everyday inventory. `CREATE_STUDIO` lists only the vehicles
 * a new studio version can be made from, so the person can pick one.
 */
export const InventoryModeSchema = z.enum(["BROWSE", "CREATE_STUDIO"]);

export const InventoryViewSchema = z.enum(["GRID", "LIST"]);

export const InventoryQuerySchema = CursorPaginationSchema.extend({
  filter: InventoryFilterSchema.default("ALL"),
  mode: InventoryModeSchema.default("BROWSE"),
  query: z.string().trim().max(120).optional(),
  sort: VehicleSortSchema.default("CREATED_DESC"),
  view: InventoryViewSchema.default("GRID"),
}).strict();

export const InventorySearchQuerySchema = CursorPaginationSchema.extend({
  q: z.string().trim().min(1).max(100),
  status: InventoryFilterSchema.default("ALL"),
  mode: InventoryModeSchema.default("BROWSE"),
  sort: VehicleSortSchema.default("CREATED_DESC"),
}).strict();

export const InventoryItemStatusSchema = z.enum([
  "PROCESSING",
  "COMPLETED",
  "FAILED",
  "ARCHIVED",
]);

export const InventoryItemSchema = z
  .object({
    id: EntityIdSchema,
    name: z.string().min(1).max(120),
    brand: z.string().max(80).nullable(),
    model: z.string().max(80).nullable(),
    year: z.number().int().nullable(),
    stockId: z.string().max(80).nullable(),
    status: InventoryItemStatusSchema,
    imageCount: z.number().int().nonnegative(),
    completedImageCount: z.number().int().nonnegative(),
    failedImageCount: z.number().int().nonnegative(),
    /** Whether any batch, not only the newest, produced a studio image. */
    hasCompletedOutput: z.boolean(),
    createdAt: IsoDateTimeSchema,
    previewUrl: z.url().nullable(),
  })
  .strict();

export const InventoryFilterCountsSchema = z
  .object({
    all: z.number().int().nonnegative(),
    processing: z.number().int().nonnegative(),
    completed: z.number().int().nonnegative(),
    needsAttention: z.number().int().nonnegative(),
    archived: z.number().int().nonnegative(),
  })
  .strict();

export const InventoryPageSchema = z
  .object({
    items: z.array(InventoryItemSchema),
    counts: InventoryFilterCountsSchema,
    nextCursor: EntityIdSchema.nullable(),
  })
  .strict();

export type InventoryFilter = z.infer<typeof InventoryFilterSchema>;
export type InventoryMode = z.infer<typeof InventoryModeSchema>;
export type InventoryView = z.infer<typeof InventoryViewSchema>;
export type InventoryQuery = z.infer<typeof InventoryQuerySchema>;
export type InventorySearchQuery = z.infer<typeof InventorySearchQuerySchema>;
export type InventoryItemStatus = z.infer<typeof InventoryItemStatusSchema>;
export type InventoryItem = z.infer<typeof InventoryItemSchema>;
export type InventoryFilterCounts = z.infer<
  typeof InventoryFilterCountsSchema
>;
export type InventoryPage = z.infer<typeof InventoryPageSchema>;
