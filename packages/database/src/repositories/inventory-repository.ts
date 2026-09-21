import type {
  InventoryFilterCounts,
  InventoryQuery,
} from "@studiocar/contracts";

import type { Prisma, PrismaClient } from "../../generated/prisma/client";
import { VehicleStatus } from "../../generated/prisma/client";
import {
  findInventoryBatchSummaries,
  type InventoryBatchSummary,
} from "./find-inventory-batch-summaries";

const OPERATIONAL_VEHICLE_STATUSES = [
  VehicleStatus.PROCESSING,
  VehicleStatus.READY,
  VehicleStatus.PARTIALLY_FAILED,
  VehicleStatus.ARCHIVED,
];

const inventoryVehicleSelect = {
  id: true,
  name: true,
  brand: true,
  model: true,
  year: true,
  stockId: true,
  status: true,
  createdAt: true,
} satisfies Prisma.VehicleSelect;

type InventoryVehicleBaseRecord = Prisma.VehicleGetPayload<{
  select: typeof inventoryVehicleSelect;
}>;

export type InventoryVehicleRecord = InventoryVehicleBaseRecord &
  Omit<InventoryBatchSummary, "vehicleId">;

export interface InventoryRepositoryPage {
  counts: InventoryFilterCounts;
  items: InventoryVehicleRecord[];
  nextCursor: string | null;
}

function statusesForFilter(
  filter: InventoryQuery["filter"],
): VehicleStatus[] {
  switch (filter) {
    case "PROCESSING":
      return [VehicleStatus.PROCESSING];
    case "COMPLETED":
      return [VehicleStatus.READY];
    case "FAILED":
      return [VehicleStatus.PARTIALLY_FAILED];
    case "ARCHIVED":
      return [VehicleStatus.ARCHIVED];
    case "ALL":
      return OPERATIONAL_VEHICLE_STATUSES;
  }
}

function inventoryOrderBy(
  sort: InventoryQuery["sort"],
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

function inventoryWhere(
  userId: string,
  query: Pick<InventoryQuery, "filter" | "query">,
): Prisma.VehicleWhereInput {
  return {
    userId,
    status: { in: statusesForFilter(query.filter) },
    ...(query.query
      ? {
          OR: [
            { name: { contains: query.query, mode: "insensitive" } },
            { brand: { contains: query.query, mode: "insensitive" } },
            { model: { contains: query.query, mode: "insensitive" } },
            { stockId: { contains: query.query, mode: "insensitive" } },
            { internalId: { contains: query.query, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

function emptyCounts(): InventoryFilterCounts {
  return {
    all: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    archived: 0,
  };
}

export class PrismaInventoryRepository {
  public constructor(private readonly database: PrismaClient) {}

  public async listOwned(
    userId: string,
    query: InventoryQuery,
  ): Promise<InventoryRepositoryPage> {
    const filteredWhere = inventoryWhere(userId, query);
    if (query.cursor) {
      const cursor = await this.database.vehicle.findFirst({
        where: { ...filteredWhere, id: query.cursor },
        select: { id: true },
      });
      if (!cursor) {
        return { counts: await this.countOwned(userId, query.query), items: [], nextCursor: null };
      }
    }

    const [records, counts] = await Promise.all([
      this.database.vehicle.findMany({
        where: filteredWhere,
        orderBy: inventoryOrderBy(query.sort),
        take: query.limit + 1,
        ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
        select: inventoryVehicleSelect,
      }),
      this.countOwned(userId, query.query),
    ]);
    const hasNextPage = records.length > query.limit;
    if (hasNextPage) records.pop();
    const summaries = await findInventoryBatchSummaries(
      this.database,
      userId,
      records.map((record) => record.id),
    );

    return {
      counts,
      items: records.map((record) => {
        const summary = summaries.get(record.id);
        return {
          ...record,
          completedImageCount: summary?.completedImageCount ?? 0,
          failedImageCount: summary?.failedImageCount ?? 0,
          imageCount: summary?.imageCount ?? 0,
          previewObjectKey: summary?.previewObjectKey ?? null,
        };
      }),
      nextCursor: hasNextPage ? (records.at(-1)?.id ?? null) : null,
    };
  }

  private async countOwned(
    userId: string,
    search: string | undefined,
  ): Promise<InventoryFilterCounts> {
    const groups = await this.database.vehicle.groupBy({
      by: ["status"],
      where: inventoryWhere(userId, { filter: "ALL", query: search }),
      _count: { _all: true },
    });
    const counts = emptyCounts();
    for (const group of groups) {
      const count = group._count._all;
      counts.all += count;
      switch (group.status) {
        case VehicleStatus.PROCESSING:
          counts.processing += count;
          break;
        case VehicleStatus.READY:
          counts.completed += count;
          break;
        case VehicleStatus.PARTIALLY_FAILED:
          counts.failed += count;
          break;
        case VehicleStatus.ARCHIVED:
          counts.archived += count;
          break;
        case VehicleStatus.DRAFT:
        case VehicleStatus.UPLOADING:
          break;
      }
    }
    return counts;
  }
}
