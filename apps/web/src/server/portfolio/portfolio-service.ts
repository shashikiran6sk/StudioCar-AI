import {
  MAX_PORTFOLIO_VERSION_IMAGES,
  MAX_PORTFOLIO_VERSIONS,
  MAX_STUDIO_SELECTION_IMAGES,
  ProcessingOptionsSchema,
  StudioSelectionContextSchema,
  VehiclePortfolioSchema,
  type PortfolioAttention,
  type PortfolioImage,
  type StudioSelectionContext,
  type VehiclePortfolio,
} from "@studiocar/contracts";
import { toProcessingFailureReason } from "@studiocar/processing";

import type {
  PortfolioJobRecord,
  PortfolioVehicleRecord,
} from "../db/repositories/portfolio-repository";
import { STUDIO_VERSION_VEHICLE_STATUSES } from "../vehicles/vehicle-status-groups.constants";
import { createPortfolioDownloadFilename } from "./create-portfolio-download-filename";
import { groupStudioVersions } from "./group-studio-versions";
import { imageRequiresReplacement } from "./image-requires-replacement";
import type {
  PortfolioApplication,
  PortfolioAssetSignerPort,
  PortfolioRepositoryPort,
  StudioSelectionRequest,
} from "./portfolio.types";
import { selectAttentionJobs, type AttentionBatch } from "./select-attention-jobs";
import {
  selectStudioSelectionSources,
  type StudioSelectionSource,
} from "./select-studio-selection-sources";
import { toPortfolioStatus } from "./to-portfolio-status";

export interface PortfolioServiceOptions {
  assetUrlTtlSeconds: number;
}

export class PortfolioService implements PortfolioApplication {
  public constructor(
    private readonly repository: PortfolioRepositoryPort,
    private readonly signer: PortfolioAssetSignerPort,
    private readonly options: PortfolioServiceOptions,
  ) {}

  public async get(
    userId: string,
    vehicleId: string,
    versionId: string | null = null,
  ): Promise<VehiclePortfolio | null> {
    const record = await this.repository.findOwned(userId, vehicleId);
    if (!record) return null;

    const versions = groupStudioVersions(record.processingJobs).slice(
      0,
      MAX_PORTFOLIO_VERSIONS,
    );
    const selected =
      versions.find((version) => version.id === versionId) ?? versions[0];
    const [images, attention] = await Promise.all([
      Promise.all(
        (selected?.jobs ?? [])
          .slice(0, MAX_PORTFOLIO_VERSION_IMAGES)
          .map((job) => this.toImage(job)),
      ),
      this.toAttention(selectAttentionJobs(record)),
    ]);

    return VehiclePortfolioSchema.parse({
      attention,
      brand: record.brand,
      canCreateVersion: STUDIO_VERSION_VEHICLE_STATUSES.includes(record.status),
      id: record.id,
      images,
      model: record.model,
      name: record.name,
      selectedVersionId: selected?.id ?? null,
      status: toPortfolioStatus(record.status),
      stockId: record.stockId,
      variant: record.variant,
      versions: versions.map((version) => ({
        completedAt: version.completedAt.toISOString(),
        id: version.id,
        imageCount: version.jobs.length,
        options: version.options,
      })),
      year: record.year,
    });
  }

  /**
   * What the Selection Dialog opens with for an existing vehicle, or null
   * when that way of opening it does not apply — for example Re-process on a
   * vehicle with nothing to fix, or any mode while a batch is running.
   */
  public async getStudioSelection(
    userId: string,
    vehicleId: string,
    request: StudioSelectionRequest,
  ): Promise<StudioSelectionContext | null> {
    const record = await this.repository.findOwned(userId, vehicleId);
    if (!record || !STUDIO_VERSION_VEHICLE_STATUSES.includes(record.status)) {
      return null;
    }
    const selection = selectStudioSelectionSources(
      request.mode,
      record.processingJobs,
      groupStudioVersions(record.processingJobs),
      request.versionId,
      selectAttentionJobs(record),
    );
    if (!selection || selection.sources.length === 0) return null;

    const images = await Promise.all(
      selection.sources
        .slice(0, MAX_STUDIO_SELECTION_IMAGES)
        .map((source) => this.toSelectionImage(source)),
    );
    return StudioSelectionContextSchema.parse({
      images,
      mode: request.mode,
      options: selection.options,
      vehicle: this.toSelectionVehicle(record),
    });
  }

  private toSelectionVehicle(record: PortfolioVehicleRecord) {
    return {
      brand: record.brand,
      id: record.id,
      model: record.model,
      name: record.name,
      stockId: record.stockId,
      variant: record.variant,
      year: record.year,
    };
  }

  private async toSelectionImage(source: StudioSelectionSource) {
    const asset = source.job.imageAsset;
    return {
      assetId: asset.id,
      displayOrder: source.job.displayOrder,
      failureReason: source.failureReason,
      height: asset.height,
      originalFilename: asset.originalFilename,
      previewUrl: await this.signer.signInline(
        asset.originalObjectKey,
        asset.mimeType,
        this.options.assetUrlTtlSeconds,
      ),
      replaceRequired: source.replaceRequired,
      selected: source.selected,
      sizeBytes: Number(asset.sizeBytes),
      width: asset.width,
    };
  }

  private async toAttention(
    batch: AttentionBatch | null,
  ): Promise<PortfolioAttention | null> {
    const first = batch?.jobs[0];
    if (!batch || !first) return null;
    const failedImages = await Promise.all(
      batch.failedJobs.map(async (job) => ({
        assetId: job.imageAsset.id,
        displayOrder: job.displayOrder,
        jobId: job.id,
        originalFilename: job.imageAsset.originalFilename,
        originalUrl: await this.signer.signInline(
          job.imageAsset.originalObjectKey,
          job.imageAsset.mimeType,
          this.options.assetUrlTtlSeconds,
        ),
        reason: toProcessingFailureReason(job.status, job.errorCode),
        replaceRequired: imageRequiresReplacement(job),
      })),
    );
    return {
      failedImages,
      imageCount: batch.jobs.length,
      options: ProcessingOptionsSchema.parse(first.options),
    };
  }

  private async toImage(job: PortfolioJobRecord): Promise<PortfolioImage> {
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
