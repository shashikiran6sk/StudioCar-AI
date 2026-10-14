import type { ProcessingOptions } from "@studiocar/contracts";
import {
  ApplicationErrorCode,
  LOG_EVENTS,
  logger,
  reportUnexpectedError,
} from "@studiocar/observability";
import {
  resolveProcessingQualityTier,
  type ClaimedProcessingJob,
  type ImageProcessingProvider,
  type ProcessingExecutionResult,
  type ProcessingJobExecutorPort,
  type ProcessingProviderKey,
} from "@studiocar/processing";

import type { ProcessingObjectStoragePort } from "../storage/processing-object-storage.types";
import { buildProcessingObjectKeys } from "./build-processing-object-keys";
import { calculateSha256 } from "./calculate-sha256";
import { composeStudioImage } from "./compose-studio-image";
import {
  createExecutionFailure as failure,
  type ProviderAttribution,
} from "./create-execution-failure";
import { decodeCutout } from "./decode-cutout";
import { encodeProcessedImage } from "./encode-processed-image";
import {
  COMPOSITION_FAILURE_MESSAGE,
  INVALID_SOURCE_IMAGE_MESSAGE,
  NO_VEHICLE_DETECTED_MESSAGE,
  OUTPUT_CHECKSUM_METADATA_KEY,
  OUTPUT_JOB_METADATA_KEY,
  OUTPUT_WEBP_CONTENT_TYPE,
  PROVIDER_REQUEST_METADATA_KEY,
  SOURCE_CHECKSUM_MISMATCH_MESSAGE,
  SOURCE_SIZE_MISMATCH_MESSAGE,
  STORAGE_FAILURE_MESSAGE,
} from "./image-execution.constants";
import type { RenderedProcessedImage } from "./image-execution.types";
import { inspectSourceImage } from "./inspect-source-image";
import { isStudioBackground } from "./is-studio-background";
import { NoVehicleDetectedError } from "./no-vehicle-detected-error";
import { ProcessingStageFailure as StageFailure } from "./processing-stage-failure";
import type { ProcessingJobExecutorOptions } from "./processing-job-executor.types";
import { renderOriginalPhoto } from "./render-original-photo";
import { STUDIO_BACKGROUND_ASSETS } from "./studio-background.constants";
import type {
  StudioBackground,
  StudioBackgroundSource,
} from "./studio-background.types";

interface ProviderCutout extends ProviderAttribution {
  bytes: Uint8Array;
}

/**
 * Runs one claimed job:
 *
 * 1. read the committed original from private S3 and validate its size,
 *    checksum and full decode — before any provider is paid;
 * 2. for a studio background, reuse the staged provider cutout from an
 *    earlier attempt, or ask the provider for one at the plan's resolution
 *    and stage it immediately;
 * 3. compose the cutout onto StudioCar's background, or keep the original
 *    photo, and encode WebP once;
 * 4. write the output and its preview to private S3 at deterministic keys.
 *
 * Every failure names its stage for metrics. Storage is never retried here:
 * the durable job retry owns that.
 */
export class ProcessingJobExecutor implements ProcessingJobExecutorPort {
  public readonly providerKey: ProcessingProviderKey;

  public constructor(
    private readonly storage: ProcessingObjectStoragePort,
    private readonly provider: ImageProcessingProvider,
    private readonly backgrounds: StudioBackgroundSource,
    private readonly options: ProcessingJobExecutorOptions,
  ) {
    this.providerKey = provider.key;
  }

  public async execute(
    job: ClaimedProcessingJob,
  ): Promise<ProcessingExecutionResult> {
    logger.log("info", LOG_EVENTS.PROCESSING_STARTED, {
      assetId: job.imageAssetId,
      userId: job.userId,
      vehicleId: job.vehicleId,
    });
    let providerCutout: ProviderCutout | null = null;
    try {
      const photo = await this.readValidatedSource(job);
      const keys = buildProcessingObjectKeys(job);
      let rendered: RenderedProcessedImage;
      if (isStudioBackground(job.options.background)) {
        providerCutout = await this.obtainCutout(job, keys.providerCutout);
        rendered = await this.compose(
          job.options.background,
          job.options,
          providerCutout,
        );
      } else {
        rendered = await this.renderOriginal(photo, job.options);
      }
      const checksumSha256 = calculateSha256(rendered.bytes);
      await this.store(keys.output, rendered.bytes, checksumSha256, job.id);
      await this.store(
        keys.preview,
        rendered.previewBytes,
        calculateSha256(rendered.previewBytes),
        job.id,
      );
      return {
        ok: true,
        output: {
          checksumSha256,
          height: rendered.height,
          mimeType: rendered.contentType,
          objectKey: keys.output,
          outputFormat: "WEBP",
          previewObjectKey: keys.preview,
          sizeBytes: BigInt(rendered.bytes.byteLength),
          width: rendered.width,
        },
        providerLatencyMilliseconds:
          providerCutout?.providerLatencyMilliseconds ?? null,
        providerRequestId: providerCutout?.providerRequestId ?? null,
      };
    } catch (error) {
      if (error instanceof StageFailure) {
        return { ok: false, failure: error.failure };
      }
      // Anything unclassified is private storage: S3 reads and writes are the
      // only steps without their own classification.
      reportUnexpectedError(error, ApplicationErrorCode.S3_UPLOAD_FAILED);
      return {
        ok: false,
        failure: failure(
          "STORAGE",
          "NETWORK",
          STORAGE_FAILURE_MESSAGE,
          providerCutout ?? undefined,
        ),
      };
    }
  }

  private async readValidatedSource(
    job: ClaimedProcessingJob,
  ): Promise<Uint8Array> {
    if (job.sizeBytes > BigInt(this.options.maximumInputBytes)) {
      throw new StageFailure(
        failure("SOURCE", "INVALID_IMAGE", SOURCE_SIZE_MISMATCH_MESSAGE),
      );
    }
    const source = await this.storage.getRequired(job.originalObjectKey);
    if (
      source.bytes.byteLength !== Number(job.sizeBytes) ||
      source.bytes.byteLength > this.options.maximumInputBytes
    ) {
      throw new StageFailure(
        failure("SOURCE", "INVALID_IMAGE", SOURCE_SIZE_MISMATCH_MESSAGE),
      );
    }
    if (
      job.checksumSha256 &&
      calculateSha256(source.bytes) !== job.checksumSha256
    ) {
      throw new StageFailure(
        failure("SOURCE", "INVALID_IMAGE", SOURCE_CHECKSUM_MISMATCH_MESSAGE),
      );
    }
    const inspection = await inspectSourceImage(
      source.bytes,
      job.mimeType,
      this.options.maximumPixels,
    );
    if (!inspection.ok) {
      throw new StageFailure(
        failure("SOURCE", inspection.failureKind, inspection.message),
      );
    }
    return inspection.image.bytes;
  }

  /**
   * The staged cutout from an earlier attempt, or a new one from the
   * provider, staged before anything else can fail. A staged object whose
   * checksum no longer matches is treated as absent rather than trusted.
   */
  private async obtainCutout(
    job: ClaimedProcessingJob,
    key: string,
  ): Promise<ProviderCutout> {
    const staged = await this.storage.getOptional(key);
    const stagedChecksum = staged?.metadata[OUTPUT_CHECKSUM_METADATA_KEY];
    if (staged && stagedChecksum === calculateSha256(staged.bytes)) {
      logger.log("info", LOG_EVENTS.PROVIDER_REUSED);
      return {
        bytes: staged.bytes,
        providerLatencyMilliseconds: null,
        providerRequestId:
          staged.metadata[PROVIDER_REQUEST_METADATA_KEY] ?? null,
      };
    }
    const result = await this.provider.removeBackground({
      correlation: {
        assetId: job.imageAssetId,
        attempt: job.attemptNumber,
        vehicleId: job.vehicleId,
      },
      jobId: job.id,
      qualityTier: resolveProcessingQualityTier(job.ownedPlanKey),
      sourceObjectKey: job.originalObjectKey,
    });
    if (!result.ok) {
      throw new StageFailure({ ...result.failure, stage: "PROVIDER" });
    }
    const cutout: ProviderCutout = {
      bytes: result.cutout.bytes,
      providerLatencyMilliseconds: result.cutout.providerLatencyMilliseconds,
      providerRequestId: result.cutout.providerRequestId,
    };
    await this.storage.put({
      bytes: cutout.bytes,
      contentType: result.cutout.contentType,
      key,
      metadata: {
        [OUTPUT_CHECKSUM_METADATA_KEY]: calculateSha256(cutout.bytes),
        [OUTPUT_JOB_METADATA_KEY]: job.id,
        ...(cutout.providerRequestId
          ? { [PROVIDER_REQUEST_METADATA_KEY]: cutout.providerRequestId }
          : {}),
      },
    });
    return cutout;
  }

  private async compose(
    background: StudioBackground,
    options: ProcessingOptions,
    cutout: ProviderCutout,
  ): Promise<RenderedProcessedImage> {
    try {
      const asset = STUDIO_BACKGROUND_ASSETS[background][options.floor];
      const composed = await composeStudioImage({
        background,
        backgroundBytes: await this.backgrounds.read(asset.file),
        cutout: await decodeCutout(cutout.bytes),
        floor: options.floor,
        options,
      });
      return await encodeProcessedImage(
        composed,
        options.quality,
        this.options.previewMaximumWidth,
      );
    } catch (error) {
      if (error instanceof NoVehicleDetectedError) {
        // The provider looked for a car and found none: the photo needs
        // replacing, exactly as when a provider rejects a non-car image.
        throw new StageFailure(
          failure("PROVIDER", "NON_CAR_IMAGE", NO_VEHICLE_DETECTED_MESSAGE, cutout),
        );
      }
      reportUnexpectedError(error, ApplicationErrorCode.IMAGE_PROCESSING_FAILED);
      throw new StageFailure(
        failure("COMPOSITION", "INTERNAL", COMPOSITION_FAILURE_MESSAGE, cutout),
      );
    }
  }

  private async renderOriginal(
    photo: Uint8Array,
    options: ProcessingOptions,
  ): Promise<RenderedProcessedImage> {
    try {
      return await encodeProcessedImage(
        await renderOriginalPhoto(photo, options.enhancement),
        options.quality,
        this.options.previewMaximumWidth,
      );
    } catch {
      throw new StageFailure(
        failure("SOURCE", "INVALID_IMAGE", INVALID_SOURCE_IMAGE_MESSAGE),
      );
    }
  }

  private store(
    key: string,
    bytes: Uint8Array,
    checksumSha256: string,
    jobId: string,
  ): Promise<void> {
    return this.storage.put({
      bytes,
      contentType: OUTPUT_WEBP_CONTENT_TYPE,
      key,
      metadata: {
        [OUTPUT_CHECKSUM_METADATA_KEY]: checksumSha256,
        [OUTPUT_JOB_METADATA_KEY]: jobId,
      },
    });
  }
}
