import type { UpdateVehicle } from "@studiocar/contracts";

import type { Prisma } from "@studiocar/database-runtime";

export function toVehicleUpdateData(
  command: UpdateVehicle,
): Prisma.VehicleUpdateManyMutationInput {
  return {
    ...(command.name === undefined ? {} : { name: command.name }),
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
