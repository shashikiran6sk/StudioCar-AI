import type { VehiclePortfolio } from "@studiocar/contracts";
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

export interface PortfolioApplication {
  get(userId: string, vehicleId: string): Promise<VehiclePortfolio | null>;
}
