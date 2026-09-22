import {
  ProcessingOptionsSchema,
  VehiclePortfolioSchema,
  type PortfolioImage,
  type VehiclePortfolio,
} from "@studiocar/contracts";
import type { PortfolioVehicleRecord } from "../db/repositories/portfolio-repository";

import { createPortfolioDownloadFilename } from "./create-portfolio-download-filename";
import type {
  PortfolioAssetSignerPort,
  PortfolioRepositoryPort,
} from "./portfolio.types";
import { toPortfolioStatus } from "./to-portfolio-status";

export interface PortfolioServiceOptions {
  assetUrlTtlSeconds: number;
}

export class PortfolioService {
  public constructor(
    private readonly repository: PortfolioRepositoryPort,
    private readonly signer: PortfolioAssetSignerPort,
    private readonly options: PortfolioServiceOptions,
  ) {}

  public async get(
    userId: string,
    vehicleId: string,
  ): Promise<VehiclePortfolio | null> {
    const record = await this.repository.findOwned(userId, vehicleId);
    if (!record || record.processingJobs.length === 0) return null;

    const images = await Promise.all(
      record.processingJobs.map((job) => this.toImage(job)),
    );
    const completedAt = record.processingJobs.reduce((latest, job) => {
      if (!job.completedAt) return latest;
      return job.completedAt > latest ? job.completedAt : latest;
    }, new Date(0));

    return VehiclePortfolioSchema.parse({
      brand: record.brand,
      completedAt: completedAt.toISOString(),
      id: record.id,
      images,
      model: record.model,
      name: record.name,
      options: ProcessingOptionsSchema.parse(record.processingJobs[0]?.options),
      status: toPortfolioStatus(record.status),
      stockId: record.stockId,
      variant: record.variant,
      year: record.year,
    });
  }

  private async toImage(
    job: PortfolioVehicleRecord["processingJobs"][number],
  ): Promise<PortfolioImage> {
    if (!job.processedAsset) {
      throw new Error("Completed portfolio job has no processed asset.");
    }
    const ttl = this.options.assetUrlTtlSeconds;
    const [originalUrl, processedUrl, previewUrl, downloadUrl] = await Promise.all([
      this.signer.signInline(
        job.imageAsset.originalObjectKey,
        job.imageAsset.mimeType,
        ttl,
      ),
      this.signer.signInline(
        job.processedAsset.objectKey,
        job.processedAsset.mimeType,
        ttl,
      ),
      this.signer.signInline(
        job.processedAsset.previewObjectKey,
        "image/webp",
        ttl,
      ),
      this.signer.signDownload(
        job.processedAsset.objectKey,
        job.processedAsset.mimeType,
        createPortfolioDownloadFilename(
          job.displayOrder,
          job.processedAsset.mimeType,
        ),
        ttl,
      ),
    ]);

    return {
      displayOrder: job.displayOrder,
      downloadUrl,
      height: job.processedAsset.height,
      id: job.processedAsset.id,
      originalFilename: job.imageAsset.originalFilename,
      originalUrl,
      previewUrl,
      processedUrl,
      width: job.processedAsset.width,
    };
  }
}
