import type {
  InventoryItem,
  InventoryPage,
  InventoryQuery,
  InventorySearchQuery,
} from "@studiocar/contracts";
import type {
  InventoryRepositoryPage,
  InventoryVehicleRecord,
} from "../db/repositories/inventory-repository";

export interface InventoryRepositoryPort {
  listOwned(
    userId: string,
    query: InventoryQuery,
  ): Promise<InventoryRepositoryPage>;
  listRecentOwned(
    userId: string,
    limit: number,
  ): Promise<InventoryVehicleRecord[]>;
  searchOwned(userId: string, query: InventorySearchQuery): Promise<InventoryRepositoryPage>;
}

export interface InventoryPreviewSignerPort {
  signPreview(objectKey: string, expiresInSeconds: number): Promise<string>;
}

export interface InventoryApplication {
  list(userId: string, query: InventoryQuery): Promise<InventoryPage>;
  listRecent(userId: string, limit: number): Promise<InventoryItem[]>;
}

export interface InventorySearchApplication extends InventoryApplication {
  search(userId: string, query: InventorySearchQuery): Promise<InventoryPage>;
}
