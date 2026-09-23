import type { Prisma, PrismaClient } from "@studiocar/database-runtime";

import { OPERATIONAL_VEHICLE_STATUSES } from "../../vehicles/vehicle-status-groups.constants";

/**
 * Enough history for every studio version and the newest batch. A vehicle
 * rarely holds more than a handful of 20-image batches.
 */
const PORTFOLIO_JOB_LIMIT = 200;

const portfolioVehicleSelect = {
  id: true,
  name: true,
  brand: true,
  model: true,
  variant: true,
  year: true,
  stockId: true,
  status: true,
  processingJobs: {
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: PORTFOLIO_JOB_LIMIT,
    select: {
      id: true,
      batchIdempotencyKey: true,
      completedAt: true,
      createdAt: true,
      displayOrder: true,
      errorCode: true,
      options: true,
      status: true,
      imageAsset: {
        select: {
          id: true,
          height: true,
          mimeType: true,
          originalFilename: true,
          originalObjectKey: true,
          sizeBytes: true,
          status: true,
          width: true,
        },
      },
      processedAsset: {
        select: {
          id: true,
          height: true,
          mimeType: true,
          objectKey: true,
          previewObjectKey: true,
          width: true,
        },
      },
    },
  },
} satisfies Prisma.VehicleSelect;

export type PortfolioVehicleRecord = Prisma.VehicleGetPayload<{
  select: typeof portfolioVehicleSelect;
}>;

export type PortfolioJobRecord = PortfolioVehicleRecord["processingJobs"][number];

export class PrismaPortfolioRepository {
  public constructor(private readonly database: PrismaClient) {}

  /**
   * An owned vehicle that has left the creation workflow, with its newest
   * processing jobs first. Every batch is kept, so earlier studio versions and
   * failed attempts stay visible after another batch is started.
   */
  public findOwned(
    userId: string,
    vehicleId: string,
  ): Promise<PortfolioVehicleRecord | null> {
    return this.database.vehicle.findFirst({
      where: {
        id: vehicleId,
        userId,
        status: { in: OPERATIONAL_VEHICLE_STATUSES },
      },
      select: portfolioVehicleSelect,
    });
  }
}
