import type { CreateVehicle, Vehicle } from "@studiocar/contracts";

export function vehicleMatchesCreateCommand(
  vehicle: Vehicle,
  command: CreateVehicle,
): boolean {
  return (
    vehicle.name === command.name &&
    vehicle.brand === (command.brand ?? null) &&
    vehicle.model === (command.model ?? null) &&
    vehicle.variant === (command.variant ?? null) &&
    vehicle.year === (command.year ?? null) &&
    vehicle.stockId === (command.stockId ?? null) &&
    vehicle.notes === (command.notes ?? null)
  );
}
