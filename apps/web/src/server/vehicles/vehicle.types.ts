import type {
  CreateVehicle,
  CreateVehicleResponse,
  UpdateVehicle,
  UpdateVehicleResponse,
  Vehicle,
} from "@studiocar/contracts";

export type ReserveVehicleResult =
  | { kind: "CREATED"; vehicle: Vehicle }
  | { kind: "EXISTING"; vehicle: Vehicle }
  | { kind: "CONFLICT" };

export type UpdateVehicleRepositoryResult =
  | { kind: "UPDATED"; vehicle: Vehicle }
  | { kind: "NOT_FOUND" }
  | { kind: "CONFLICT" };

export interface VehicleRepositoryPort {
  reserveDraftOwned(
    userId: string,
    idempotencyKey: string,
    command: CreateVehicle,
  ): Promise<ReserveVehicleResult>;
  updateDraftOwned(
    userId: string,
    vehicleId: string,
    command: UpdateVehicle,
  ): Promise<UpdateVehicleRepositoryResult>;
}

export type CreateVehicleResult =
  | { ok: true; response: CreateVehicleResponse }
  | {
      ok: false;
      reason: "IDEMPOTENCY_CONFLICT" | "REFERENCE_CONFLICT";
    };

export type UpdateVehicleResult =
  | { ok: true; response: UpdateVehicleResponse }
  | { ok: false; reason: "NOT_FOUND" | "REFERENCE_CONFLICT" };

export interface VehicleApplication {
  create(
    userId: string,
    idempotencyKey: string,
    command: CreateVehicle,
  ): Promise<CreateVehicleResult>;
  update(
    userId: string,
    vehicleId: string,
    command: UpdateVehicle,
  ): Promise<UpdateVehicleResult>;
}
