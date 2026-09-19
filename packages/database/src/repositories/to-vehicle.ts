import type { Vehicle } from "@studiocar/contracts";

import type { Prisma } from "../../generated/prisma/client";

export const vehicleSelect = {
  id: true,
  name: true,
  brand: true,
  model: true,
  variant: true,
  year: true,
  stockId: true,
  internalId: true,
  notes: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.VehicleSelect;

export type VehicleRecord = Prisma.VehicleGetPayload<{
  select: typeof vehicleSelect;
}>;

export function toVehicle(record: VehicleRecord): Vehicle {
  return {
    id: record.id,
    name: record.name,
    brand: record.brand,
    model: record.model,
    variant: record.variant,
    year: record.year,
    stockId: record.stockId,
    internalId: record.internalId,
    notes: record.notes,
    status: record.status,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}
