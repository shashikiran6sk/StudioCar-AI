import { z } from "zod";

import { CursorPaginationSchema } from "./common";

const currentYear = new Date().getUTCFullYear();

const optionalText = (maximum: number) =>
  z.string().trim().min(1).max(maximum).optional();

export const VehicleStatusSchema = z.enum([
  "DRAFT",
  "UPLOADING",
  "PROCESSING",
  "READY",
  "PARTIALLY_FAILED",
  "ARCHIVED",
]);

export const CreateVehicleSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    brand: optionalText(80),
    model: optionalText(80),
    variant: optionalText(80),
    year: z.coerce.number().int().min(1886).max(currentYear + 1).optional(),
    stockId: optionalText(80),
    internalId: optionalText(80),
    notes: optionalText(2_000),
  })
  .strict();

export const UpdateVehicleSchema = CreateVehicleSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "At least one vehicle field must be provided." },
);

export const VehicleSortSchema = z.enum([
  "CREATED_DESC",
  "CREATED_ASC",
  "NAME_ASC",
  "NAME_DESC",
]);

export const VehicleListQuerySchema = CursorPaginationSchema.extend({
  query: z.string().trim().max(120).optional(),
  status: VehicleStatusSchema.optional(),
  sort: VehicleSortSchema.default("CREATED_DESC"),
}).strict();

export type VehicleStatus = z.infer<typeof VehicleStatusSchema>;
export type CreateVehicle = z.infer<typeof CreateVehicleSchema>;
export type UpdateVehicle = z.infer<typeof UpdateVehicleSchema>;
export type VehicleListQuery = z.infer<typeof VehicleListQuerySchema>;
