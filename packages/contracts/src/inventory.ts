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
  "FAILED",
  "ARCHIVED",
]);

export const InventoryViewSchema = z.enum(["GRID", "LIST"]);

export const InventoryQuerySchema = CursorPaginationSchema.extend({
  filter: InventoryFilterSchema.default("ALL"),
  query: z.string().trim().max(120).optional(),
  sort: VehicleSortSchema.default("CREATED_DESC"),
  view: InventoryViewSchema.default("GRID"),
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
    createdAt: IsoDateTimeSchema,
    previewUrl: z.url().nullable(),
  })
  .strict();

export const InventoryFilterCountsSchema = z
  .object({
    all: z.number().int().nonnegative(),
    processing: z.number().int().nonnegative(),
    completed: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
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
export type InventoryView = z.infer<typeof InventoryViewSchema>;
export type InventoryQuery = z.infer<typeof InventoryQuerySchema>;
export type InventoryItemStatus = z.infer<typeof InventoryItemStatusSchema>;
export type InventoryItem = z.infer<typeof InventoryItemSchema>;
export type InventoryFilterCounts = z.infer<
  typeof InventoryFilterCountsSchema
>;
export type InventoryPage = z.infer<typeof InventoryPageSchema>;
