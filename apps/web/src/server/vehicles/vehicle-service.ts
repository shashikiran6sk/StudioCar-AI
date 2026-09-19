import type { CreateVehicle, UpdateVehicle } from "@studiocar/contracts";

import { vehicleMatchesCreateCommand } from "./vehicle-matches-create-command";
import type {
  CreateVehicleResult,
  UpdateVehicleResult,
  VehicleApplication,
  VehicleRepositoryPort,
} from "./vehicle.types";

export class VehicleService implements VehicleApplication {
  public constructor(private readonly vehicles: VehicleRepositoryPort) {}

  public async create(
    userId: string,
    idempotencyKey: string,
    command: CreateVehicle,
  ): Promise<CreateVehicleResult> {
    const reservation = await this.vehicles.reserveDraftOwned(
      userId,
      idempotencyKey,
      command,
    );
    if (reservation.kind === "CONFLICT") {
      return { ok: false, reason: "REFERENCE_CONFLICT" };
    }
    if (
      reservation.kind === "EXISTING" &&
      !vehicleMatchesCreateCommand(reservation.vehicle, command)
    ) {
      return { ok: false, reason: "IDEMPOTENCY_CONFLICT" };
    }
    return {
      ok: true,
      response: {
        vehicle: reservation.vehicle,
        replayed: reservation.kind === "EXISTING",
      },
    };
  }

  public async update(
    userId: string,
    vehicleId: string,
    command: UpdateVehicle,
  ): Promise<UpdateVehicleResult> {
    const result = await this.vehicles.updateDraftOwned(
      userId,
      vehicleId,
      command,
    );
    switch (result.kind) {
      case "UPDATED":
        return { ok: true, response: { vehicle: result.vehicle } };
      case "NOT_FOUND":
        return { ok: false, reason: "NOT_FOUND" };
      case "CONFLICT":
        return { ok: false, reason: "REFERENCE_CONFLICT" };
    }
  }
}
