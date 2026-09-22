import type {
  CreateVehicle,
  UpdateVehicle,
  Vehicle,
  VehicleListQuery,
} from "@studiocar/contracts";

import type { PrismaClient } from "@studiocar/database-runtime";
import { Prisma, VehicleStatus } from "@studiocar/database-runtime";
import { toVehicleCreateData } from "./to-vehicle-create-data";
import { toVehicleUpdateData } from "./to-vehicle-update-data";
import { toVehicle, vehicleSelect } from "./to-vehicle";

export interface VehiclePage {
  items: Vehicle[];
  nextCursor: string | null;
}

export type ReserveVehicleResult =
  | { kind: "CREATED"; vehicle: Vehicle }
  | { kind: "EXISTING"; vehicle: Vehicle }
  | { kind: "CONFLICT" };

export type UpdateVehicleResult =
  | { kind: "UPDATED"; vehicle: Vehicle }
  | { kind: "NOT_FOUND" }
  | { kind: "CONFLICT" };

function vehicleOrderBy(
  sort: VehicleListQuery["sort"],
): Prisma.VehicleOrderByWithRelationInput[] {
  switch (sort) {
    case "CREATED_ASC":
      return [{ createdAt: "asc" }, { id: "asc" }];
    case "NAME_ASC":
      return [{ name: "asc" }, { id: "asc" }];
    case "NAME_DESC":
      return [{ name: "desc" }, { id: "desc" }];
    case "CREATED_DESC":
      return [{ createdAt: "desc" }, { id: "desc" }];
  }
}

export class PrismaVehicleRepository {
  public constructor(private readonly database: PrismaClient) {}

  public async createOwned(
    userId: string,
    command: CreateVehicle,
  ): Promise<Vehicle> {
    const record = await this.database.vehicle.create({
      data: toVehicleCreateData(userId, command),
      select: vehicleSelect,
    });
    return toVehicle(record);
  }

  public async reserveDraftOwned(
    userId: string,
    idempotencyKey: string,
    command: CreateVehicle,
  ): Promise<ReserveVehicleResult> {
    const existing = await this.findByCreationIdempotencyKey(
      userId,
      idempotencyKey,
    );
    if (existing) return { kind: "EXISTING", vehicle: existing };

    try {
      const record = await this.database.vehicle.create({
        data: toVehicleCreateData(userId, command, idempotencyKey),
        select: vehicleSelect,
      });
      return { kind: "CREATED", vehicle: toVehicle(record) };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const raced = await this.findByCreationIdempotencyKey(
          userId,
          idempotencyKey,
        );
        if (raced) return { kind: "EXISTING", vehicle: raced };
        return { kind: "CONFLICT" };
      }
      throw error;
    }
  }

  public async findOwnedById(
    userId: string,
    vehicleId: string,
  ): Promise<Vehicle | null> {
    const record = await this.database.vehicle.findFirst({
      where: { id: vehicleId, userId },
      select: vehicleSelect,
    });
    return record ? toVehicle(record) : null;
  }

  public async updateOwned(
    userId: string,
    vehicleId: string,
    command: UpdateVehicle,
  ): Promise<Vehicle | null> {
    const result = await this.database.vehicle.updateMany({
      where: { id: vehicleId, userId },
      data: toVehicleUpdateData(command),
    });

    if (result.count === 0) return null;
    return this.findOwnedById(userId, vehicleId);
  }

  public async updateDraftOwned(
    userId: string,
    vehicleId: string,
    command: UpdateVehicle,
  ): Promise<UpdateVehicleResult> {
    try {
      const result = await this.database.vehicle.updateMany({
        where: { id: vehicleId, userId, status: VehicleStatus.DRAFT },
        data: toVehicleUpdateData(command),
      });
      if (result.count === 0) return { kind: "NOT_FOUND" };

      const vehicle = await this.findOwnedById(userId, vehicleId);
      return vehicle
        ? { kind: "UPDATED", vehicle }
        : { kind: "NOT_FOUND" };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return { kind: "CONFLICT" };
      }
      throw error;
    }
  }

  public async listOwned(
    userId: string,
    query: VehicleListQuery,
  ): Promise<VehiclePage> {
    if (query.cursor) {
      const cursorIsOwned = await this.database.vehicle.findFirst({
        where: { id: query.cursor, userId },
        select: { id: true },
      });

      if (!cursorIsOwned) return { items: [], nextCursor: null };
    }

    const records = await this.database.vehicle.findMany({
      where: {
        userId,
        ...(query.status === undefined ? {} : { status: query.status }),
        ...(query.query
          ? {
              OR: [
                { name: { contains: query.query, mode: "insensitive" } },
                { brand: { contains: query.query, mode: "insensitive" } },
                { model: { contains: query.query, mode: "insensitive" } },
                { stockId: { contains: query.query, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: vehicleOrderBy(query.sort),
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      select: vehicleSelect,
    });
    const hasNextPage = records.length > query.limit;

    if (hasNextPage) records.pop();
    const items = records.map(toVehicle);

    return {
      items,
      nextCursor: hasNextPage ? (items.at(-1)?.id ?? null) : null,
    };
  }

  private async findByCreationIdempotencyKey(
    userId: string,
    idempotencyKey: string,
  ): Promise<Vehicle | null> {
    const record = await this.database.vehicle.findFirst({
      where: { userId, creationIdempotencyKey: idempotencyKey },
      select: vehicleSelect,
    });
    return record ? toVehicle(record) : null;
  }
}
