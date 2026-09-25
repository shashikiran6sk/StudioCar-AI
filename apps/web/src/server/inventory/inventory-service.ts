import type {
  InventoryItem,
  InventoryPage,
  InventoryQuery,
  InventorySearchQuery,
} from "@studiocar/contracts";
import type { InventoryVehicleRecord } from "../db/repositories/inventory-repository";

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
    return this.toPage(await this.repository.listOwned(userId, query));
  }

  public async search(
    userId: string,
    query: InventorySearchQuery,
  ): Promise<InventoryPage> {
    return this.toPage(await this.repository.searchOwned(userId, query));
  }

  private async toPage(page: Awaited<ReturnType<InventoryRepositoryPort["listOwned"]>>): Promise<InventoryPage> {
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
    const previewUrl = record.previewObjectKey
      ? await this.previewSigner.signPreview(
          record.previewObjectKey,
          this.options.previewUrlTtlSeconds,
        )
      : null;

    return {
      brand: record.brand,
      completedImageCount: record.completedImageCount,
      createdAt: record.createdAt.toISOString(),
      failedImageCount: record.failedImageCount,
      hasCompletedOutput: record.hasCompletedOutput,
      id: record.id,
      imageCount: record.imageCount,
      model: record.model,
      name: record.name,
      previewUrl,
      status: toInventoryItemStatus(record.status),
      stockId: record.stockId,
      year: record.year,
    };
  }
}
