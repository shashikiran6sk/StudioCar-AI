import type { CreateVehicle } from "@studiocar/contracts";

import type { Prisma } from "../../generated/prisma/client";

export function toVehicleCreateData(
  userId: string,
  command: CreateVehicle,
  creationIdempotencyKey?: string,
): Prisma.VehicleUncheckedCreateInput {
  return {
    userId,
    ...(creationIdempotencyKey === undefined
      ? {}
      : { creationIdempotencyKey }),
    name: command.name,
    ...(command.brand === undefined ? {} : { brand: command.brand }),
    ...(command.model === undefined ? {} : { model: command.model }),
    ...(command.variant === undefined ? {} : { variant: command.variant }),
    ...(command.year === undefined ? {} : { year: command.year }),
    ...(command.stockId === undefined ? {} : { stockId: command.stockId }),
    ...(command.internalId === undefined
      ? {}
      : { internalId: command.internalId }),
    ...(command.notes === undefined ? {} : { notes: command.notes }),
  };
}
