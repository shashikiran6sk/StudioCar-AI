import type {
  CreateVehicle,
  UpdateVehicle,
  VehicleListQuery,
} from "@studiocar/contracts";

import type { Prisma, PrismaClient } from "../../generated/prisma/client";

const vehicleSelect = {
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

export interface VehiclePage {
  items: VehicleRecord[];
  nextCursor: string | null;
}

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
  ): Promise<VehicleRecord> {
    return this.database.vehicle.create({
      data: {
        userId,
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
      },
      select: vehicleSelect,
    });
  }

  public async findOwnedById(
    userId: string,
    vehicleId: string,
  ): Promise<VehicleRecord | null> {
    return this.database.vehicle.findFirst({
      where: { id: vehicleId, userId },
      select: vehicleSelect,
    });
  }

  public async updateOwned(
    userId: string,
    vehicleId: string,
    command: UpdateVehicle,
  ): Promise<VehicleRecord | null> {
    const result = await this.database.vehicle.updateMany({
      where: { id: vehicleId, userId },
      data: {
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
      },
    });

    if (result.count === 0) return null;
    return this.findOwnedById(userId, vehicleId);
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

    const items = await this.database.vehicle.findMany({
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
    const hasNextPage = items.length > query.limit;

    if (hasNextPage) items.pop();

    return {
      items,
      nextCursor: hasNextPage ? (items.at(-1)?.id ?? null) : null,
    };
  }
}
