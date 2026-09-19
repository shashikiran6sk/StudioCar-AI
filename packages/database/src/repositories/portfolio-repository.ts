import type { Prisma, PrismaClient } from "../../generated/prisma/client";
import {
  ProcessingJobStatus,
  VehicleStatus,
} from "../../generated/prisma/client";

const PORTFOLIO_VEHICLE_STATUSES = [
  VehicleStatus.READY,
  VehicleStatus.PARTIALLY_FAILED,
  VehicleStatus.ARCHIVED,
];

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
    orderBy: [{ displayOrder: "asc" }, { id: "asc" }],
    select: {
      id: true,
      displayOrder: true,
      completedAt: true,
      options: true,
      imageAsset: {
        select: {
          mimeType: true,
          originalFilename: true,
          originalObjectKey: true,
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

export class PrismaPortfolioRepository {
  public constructor(private readonly database: PrismaClient) {}

  public async findOwned(
    userId: string,
    vehicleId: string,
  ): Promise<PortfolioVehicleRecord | null> {
    const latestJob = await this.database.processingJob.findFirst({
      where: {
        userId,
        vehicleId,
        status: ProcessingJobStatus.COMPLETED,
        processedAsset: { isNot: null },
      },
      orderBy: [{ completedAt: "desc" }, { id: "desc" }],
      select: { batchRequestHash: true, id: true },
    });
    if (!latestJob) return null;

    return this.database.vehicle.findFirst({
      where: {
        id: vehicleId,
        userId,
        status: { in: PORTFOLIO_VEHICLE_STATUSES },
      },
      select: {
        ...portfolioVehicleSelect,
        processingJobs: {
          ...portfolioVehicleSelect.processingJobs,
          where: {
            status: ProcessingJobStatus.COMPLETED,
            processedAsset: { isNot: null },
            ...(latestJob.batchRequestHash
              ? { batchRequestHash: latestJob.batchRequestHash }
              : { id: latestJob.id }),
          },
        },
      },
    });
  }
}
