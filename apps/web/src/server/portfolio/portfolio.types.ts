import type {
  ExistingVehicleSelectionMode,
  StudioSelectionContext,
  VehiclePortfolio,
} from "@studiocar/contracts";
import type { PortfolioVehicleRecord } from "../db/repositories/portfolio-repository";

export interface PortfolioRepositoryPort {
  findOwned(userId: string, vehicleId: string): Promise<PortfolioVehicleRecord | null>;
}

export interface PortfolioAssetSignerPort {
  signInline(
    objectKey: string,
    mimeType: string,
    expiresInSeconds: number,
  ): Promise<string>;
  signDownload(
    objectKey: string,
    mimeType: string,
    filename: string,
    expiresInSeconds: number,
  ): Promise<string>;
}

export interface StudioSelectionRequest {
  mode: ExistingVehicleSelectionMode;
  /** The studio version a new one starts from; the newest when absent. */
  versionId: string | null;
}

export interface PortfolioApplication {
  get(
    userId: string,
    vehicleId: string,
    versionId?: string | null,
  ): Promise<VehiclePortfolio | null>;
  getStudioSelection(
    userId: string,
    vehicleId: string,
    request: StudioSelectionRequest,
  ): Promise<StudioSelectionContext | null>;
}
