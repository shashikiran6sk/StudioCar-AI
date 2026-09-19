import type {
  InventoryItem,
  InventoryPage,
  InventoryQuery,
} from "@studiocar/contracts";
import {
  ProcessingJobStatus,
  type InventoryVehicleRecord,
} from "@studiocar/database";

import type {
  InventoryPreviewSignerPort,
  InventoryRepositoryPort,
} from "./inventory.types";
import { toInventoryItemStatus } from "./to-inventory-item-status";

export interface InventoryServiceOptions {
  previewUrlTtlSeconds: number;
}

export class InventoryService {
  public constructor(
    private readonly repository: InventoryRepositoryPort,
    private readonly previewSigner: InventoryPreviewSignerPort,
    private readonly options: InventoryServiceOptions,
  ) {}

  public async list(
    userId: string,
    query: InventoryQuery,
  ): Promise<InventoryPage> {
    const page = await this.repository.listOwned(userId, query);
    const items = await Promise.all(
      page.items.map((record) => this.toItem(record)),
    );

    return {
      counts: page.counts,
      items,
      nextCursor: page.nextCursor,
    };
  }

  private async toItem(record: InventoryVehicleRecord): Promise<InventoryItem> {
    const completedImageCount = record.processingJobs.filter(
      (job) => job.status === ProcessingJobStatus.COMPLETED,
    ).length;
    const failedImageCount = record.processingJobs.filter(
      (job) =>
        job.status === ProcessingJobStatus.FAILED ||
        job.status === ProcessingJobStatus.CANCELLED,
    ).length;
    const previewObjectKey = record.processingJobs.find(
      (job) => job.processedAsset !== null,
    )?.processedAsset?.previewObjectKey;
    const previewUrl = previewObjectKey
      ? await this.previewSigner.signPreview(
          previewObjectKey,
          this.options.previewUrlTtlSeconds,
        )
      : null;

    return {
      brand: record.brand,
      completedImageCount,
      createdAt: record.createdAt.toISOString(),
      failedImageCount,
      id: record.id,
      imageCount: record.processingJobs.length,
      model: record.model,
      name: record.name,
      previewUrl,
      status: toInventoryItemStatus(record.status),
      stockId: record.stockId,
      year: record.year,
    };
  }
}
