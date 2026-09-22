import type { PrismaClient } from "@studiocar/database-runtime";
import {
  ImageAssetStatus,
  ProcessingJobStatus,
  UsageEventType,
  VehicleStatus,
} from "@studiocar/database-runtime";

const PROCESSED_VEHICLE_STATUSES = [
  VehicleStatus.READY,
  VehicleStatus.PARTIALLY_FAILED,
  VehicleStatus.ARCHIVED,
];
const ACTIVE_JOB_STATUSES = [
  ProcessingJobStatus.CREATED,
  ProcessingJobStatus.QUEUED,
  ProcessingJobStatus.PROCESSING,
  ProcessingJobStatus.RETRYING,
];
const UNSUCCESSFUL_JOB_STATUSES = [
  ProcessingJobStatus.FAILED,
  ProcessingJobStatus.CANCELLED,
];

export interface DashboardRepositoryMetrics {
  activeImageCount: number;
  completedJobCount: number;
  imagesProcessed: number;
  imagesProcessedThisPeriod: number;
  storageUsedBytes: bigint;
  unsuccessfulJobCount: number;
  vehiclesProcessed: number;
  vehiclesProcessedThisPeriod: number;
  vehiclesProcessing: number;
}

export class PrismaDashboardRepository {
  public constructor(private readonly database: PrismaClient) {}

  public async getOwnedMetrics(
    userId: string,
    billingPeriodKey: string,
    periodStart: Date,
  ): Promise<DashboardRepositoryMetrics> {
    const [
      vehiclesProcessed,
      vehiclesProcessedThisPeriod,
      vehiclesProcessing,
      activeImageCount,
      completedJobCount,
      unsuccessfulJobCount,
      processedUsage,
      periodUsage,
      originalStorage,
      processedStorage,
    ] = await Promise.all([
      this.database.vehicle.count({
        where: { userId, status: { in: PROCESSED_VEHICLE_STATUSES } },
      }),
      this.database.processingJob.groupBy({
        by: ["vehicleId"],
        where: {
          completedAt: { gte: periodStart },
          status: ProcessingJobStatus.COMPLETED,
          userId,
        },
      }),
      this.database.vehicle.count({
        where: { status: VehicleStatus.PROCESSING, userId },
      }),
      this.database.processingJob.count({
        where: { status: { in: ACTIVE_JOB_STATUSES }, userId },
      }),
      this.database.processingJob.count({
        where: { status: ProcessingJobStatus.COMPLETED, userId },
      }),
      this.database.processingJob.count({
        where: { status: { in: UNSUCCESSFUL_JOB_STATUSES }, userId },
      }),
      this.database.usageEvent.aggregate({
        where: { type: UsageEventType.BACKGROUND_REMOVAL_COMPLETED, userId },
        _sum: { quantity: true },
      }),
      this.database.usageEvent.aggregate({
        where: {
          billingPeriodKey,
          type: UsageEventType.BACKGROUND_REMOVAL_COMPLETED,
          userId,
        },
        _sum: { quantity: true },
      }),
      this.database.imageAsset.aggregate({
        where: { status: ImageAssetStatus.UPLOADED, userId },
        _sum: { sizeBytes: true },
      }),
      this.database.processedAsset.aggregate({
        where: { userId },
        _sum: { sizeBytes: true },
      }),
    ]);

    return {
      activeImageCount,
      completedJobCount,
      imagesProcessed: processedUsage._sum.quantity ?? 0,
      imagesProcessedThisPeriod: periodUsage._sum.quantity ?? 0,
      storageUsedBytes:
        (originalStorage._sum.sizeBytes ?? 0n) +
        (processedStorage._sum.sizeBytes ?? 0n),
      unsuccessfulJobCount,
      vehiclesProcessed,
      vehiclesProcessedThisPeriod: vehiclesProcessedThisPeriod.length,
      vehiclesProcessing,
    };
  }
}
