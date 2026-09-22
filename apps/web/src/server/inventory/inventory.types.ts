import type {
  InventoryPage,
  InventoryQuery,
} from "@studiocar/contracts";
import type { InventoryRepositoryPage } from "../db/repositories/inventory-repository";

export interface InventoryRepositoryPort {
  listOwned(
    userId: string,
    query: InventoryQuery,
  ): Promise<InventoryRepositoryPage>;
}

export interface InventoryPreviewSignerPort {
  signPreview(objectKey: string, expiresInSeconds: number): Promise<string>;
}

export interface InventoryApplication {
  list(userId: string, query: InventoryQuery): Promise<InventoryPage>;
}
