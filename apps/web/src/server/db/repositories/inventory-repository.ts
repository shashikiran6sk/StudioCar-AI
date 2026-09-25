import type {
  InventoryFilterCounts,
  InventoryQuery,
  InventorySearchQuery,
} from "@studiocar/contracts";

import type { Prisma, PrismaClient } from "@studiocar/database-runtime";
import { VehicleStatus } from "@studiocar/database-runtime";
import {
  findInventoryBatchSummaries,
  type InventoryBatchSummary,
} from "./find-inventory-batch-summaries";
import {
  NEEDS_ATTENTION_VEHICLE_STATUSES,
  OPERATIONAL_VEHICLE_STATUSES,
  STUDIO_VERSION_VEHICLE_STATUSES,
} from "../../vehicles/vehicle-status-groups.constants";


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
    case "NEEDS_ATTENTION":
      return NEEDS_ATTENTION_VEHICLE_STATUSES;
    case "ARCHIVED":
      return [VehicleStatus.ARCHIVED];
    case "ALL":
      return OPERATIONAL_VEHICLE_STATUSES;
  }
}

/**
 * Choosing a vehicle for a new studio version lists only vehicles a version
 * can be started for, within whatever status filter is active.
 */
function statusesForQuery(
  query: Pick<InventoryQuery, "filter" | "mode">,
): VehicleStatus[] {
  const statuses = statusesForFilter(query.filter);
  return query.mode === "CREATE_STUDIO"
    ? statuses.filter((status) => STUDIO_VERSION_VEHICLE_STATUSES.includes(status))
    : statuses;
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
  query: Pick<InventoryQuery, "filter" | "mode" | "query">,
  searchSource: "LEGACY_FIELDS" | "NAME_ONLY",
): Prisma.VehicleWhereInput {
  return {
    userId,
    status: { in: statusesForQuery(query) },
    ...(query.query
      ? searchSource === "NAME_ONLY"
        ? { name: { contains: query.query, mode: "insensitive" } }
        : {
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
    needsAttention: 0,
    archived: 0,
  };
}

export class PrismaInventoryRepository {
  public constructor(private readonly database: PrismaClient) {}

  public async listOwned(
    userId: string,
    query: InventoryQuery,
  ): Promise<InventoryRepositoryPage> {
    return this.readOwned(userId, query, "LEGACY_FIELDS");
  }

  public async searchOwned(
    userId: string,
    query: InventorySearchQuery,
  ): Promise<InventoryRepositoryPage> {
    return this.readOwned(userId, {
      ...(query.cursor ? { cursor: query.cursor } : {}),
      filter: query.status,
      limit: query.limit,
      mode: query.mode,
      query: query.q,
      sort: query.sort,
      view: "GRID",
    }, "NAME_ONLY");
  }

  private async readOwned(
    userId: string,
    query: InventoryQuery,
    searchSource: "LEGACY_FIELDS" | "NAME_ONLY",
  ): Promise<InventoryRepositoryPage> {
    const filteredWhere = inventoryWhere(userId, query, searchSource);
    if (query.cursor) {
      const cursor = await this.database.vehicle.findFirst({
        where: { ...filteredWhere, id: query.cursor },
        select: { id: true },
      });
      if (!cursor) {
        return {
          counts: await this.countOwned(userId, query, searchSource),
          items: [],
          nextCursor: null,
        };
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
      this.countOwned(userId, query, searchSource),
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
          hasCompletedOutput: summary?.hasCompletedOutput ?? false,
          imageCount: summary?.imageCount ?? 0,
          previewObjectKey: summary?.previewObjectKey ?? null,
        };
      }),
      nextCursor: hasNextPage ? (records.at(-1)?.id ?? null) : null,
    };
  }

  private async countOwned(
    userId: string,
    query: Pick<InventoryQuery, "mode" | "query">,
    searchSource: "LEGACY_FIELDS" | "NAME_ONLY",
  ): Promise<InventoryFilterCounts> {
    const groups = await this.database.vehicle.groupBy({
      by: ["status"],
      where: inventoryWhere(userId, {
        filter: "ALL",
        mode: query.mode,
        query: query.query,
      }, searchSource),
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
          counts.needsAttention += count;
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
