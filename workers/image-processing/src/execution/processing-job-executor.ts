import { LOG_EVENTS } from "@studiocar/observability";
import {
  ApplicationErrorCode,
  logger,
  reportUnexpectedError,
} from "@studiocar/observability";
import type {
  BackgroundRemovalProvider,
  ClaimedProcessingJob,
  ProcessingExecutionFailure,
  ProcessingExecutionResult,
  ProcessingJobExecutorPort,
} from "@studiocar/processing";

import type { ProcessingObjectStoragePort } from "../storage/processing-object-storage.types";
import { buildProcessingObjectKeys } from "./build-processing-object-keys";
import { calculateSha256 } from "./calculate-sha256";
import {
  INVALID_SOURCE_IMAGE_MESSAGE,
  OUTPUT_CHECKSUM_METADATA_KEY,
  OUTPUT_JOB_METADATA_KEY,
  OUTPUT_WEBP_CONTENT_TYPE,
  PROVIDER_REQUEST_METADATA_KEY,
  PROVIDER_RESULT_INVALID_MESSAGE,
  SOURCE_CHECKSUM_MISMATCH_MESSAGE,
  SOURCE_SIZE_MISMATCH_MESSAGE,
  STORAGE_FAILURE_MESSAGE,
} from "./image-execution.constants";
import { inspectSourceImage } from "./inspect-source-image";
import type { ProcessingJobExecutorOptions } from "./processing-job-executor.types";
import { renderProcessedImage } from "./render-processed-image";

export class ProcessingJobExecutor implements ProcessingJobExecutorPort {
  public constructor(
    private readonly storage: ProcessingObjectStoragePort,
    private readonly provider: BackgroundRemovalProvider,
    private readonly options: ProcessingJobExecutorOptions,
  ) {}

  public async execute(
    job: ClaimedProcessingJob,
  ): Promise<ProcessingExecutionResult> {
    logger.log("info", LOG_EVENTS.PROCESSING_STARTED, {
      assetId: job.imageAssetId,
      userId: job.userId,
      vehicleId: job.vehicleId,
    });
    if (job.sizeBytes > BigInt(this.options.maximumInputBytes)) {
      return this.failure("INVALID_IMAGE", SOURCE_SIZE_MISMATCH_MESSAGE);
    }

    try {
      const sourceObject = await this.storage.getRequired(
        job.originalObjectKey,
      );
      if (
        sourceObject.bytes.byteLength !== Number(job.sizeBytes) ||
        sourceObject.bytes.byteLength > this.options.maximumInputBytes
      ) {
        return this.failure("INVALID_IMAGE", SOURCE_SIZE_MISMATCH_MESSAGE);
      }
      if (
        job.checksumSha256 &&
        calculateSha256(sourceObject.bytes) !== job.checksumSha256
      ) {
        return this.failure("INVALID_IMAGE", SOURCE_CHECKSUM_MISMATCH_MESSAGE);
      }

      const inspection = await inspectSourceImage(
        sourceObject.bytes,
        job.mimeType,
        this.options.maximumPixels,
      );
      if (!inspection.ok) {
        return this.failure(inspection.failureKind, inspection.message);
      }

      const keys = buildProcessingObjectKeys(job);
      let treatmentBytes = inspection.image.bytes;
      let providerLatencyMilliseconds: number | null = null;
      let providerRequestId: string | null = null;
      if (job.options.background !== "ORIGINAL") {
        const stagedProviderResult = await this.storage.getOptional(
          keys.providerResult,
        );
        if (stagedProviderResult) {
          logger.log("info", LOG_EVENTS.PROVIDER_REUSED);
          const stagedChecksum =
            stagedProviderResult.metadata[OUTPUT_CHECKSUM_METADATA_KEY];
          if (
            !stagedChecksum ||
            stagedChecksum !== calculateSha256(stagedProviderResult.bytes)
          ) {
            return this.failure("NETWORK", STORAGE_FAILURE_MESSAGE);
          }
          treatmentBytes = stagedProviderResult.bytes;
          providerRequestId =
            stagedProviderResult.metadata[PROVIDER_REQUEST_METADATA_KEY] ?? null;
        } else {
          const providerResult = await this.provider.process({
            bytes: inspection.image.bytes,
            contentType: inspection.image.contentType,
            idempotencyKey: job.id,
            shadow: job.options.shadow,
          });
          if (!providerResult.ok) return providerResult;

          treatmentBytes = providerResult.result.bytes;
          providerLatencyMilliseconds =
            providerResult.result.providerLatencyMilliseconds;
          providerRequestId = providerResult.result.providerRequestId;
          const providerChecksum = calculateSha256(treatmentBytes);
          await this.storage.put({
            bytes: treatmentBytes,
            contentType: providerResult.result.contentType,
            key: keys.providerResult,
            metadata: {
              [OUTPUT_CHECKSUM_METADATA_KEY]: providerChecksum,
              [OUTPUT_JOB_METADATA_KEY]: job.id,
              ...(providerRequestId
                ? { [PROVIDER_REQUEST_METADATA_KEY]: providerRequestId }
                : {}),
            },
          });
        }
      }

      let rendered;
      try {
        rendered = await renderProcessedImage({
          bytes: treatmentBytes,
          options: job.options,
          previewMaxWidth: this.options.previewMaximumWidth,
        });
      } catch {
        return this.failure(
          job.options.background === "ORIGINAL"
            ? "INVALID_IMAGE"
            : "PROVIDER_5XX",
          job.options.background === "ORIGINAL"
            ? INVALID_SOURCE_IMAGE_MESSAGE
            : PROVIDER_RESULT_INVALID_MESSAGE,
          providerLatencyMilliseconds,
          providerRequestId,
        );
      }

      const outputChecksum = calculateSha256(rendered.bytes);
      const outputMetadata = {
        [OUTPUT_CHECKSUM_METADATA_KEY]: outputChecksum,
        [OUTPUT_JOB_METADATA_KEY]: job.id,
      };
      await this.storage.put({
        bytes: rendered.bytes,
        contentType: rendered.contentType,
        key: keys.output,
        metadata: outputMetadata,
      });
      await this.storage.put({
        bytes: rendered.previewBytes,
        contentType: OUTPUT_WEBP_CONTENT_TYPE,
        key: keys.preview,
        metadata: {
          [OUTPUT_CHECKSUM_METADATA_KEY]: calculateSha256(
            rendered.previewBytes,
          ),
          [OUTPUT_JOB_METADATA_KEY]: job.id,
        },
      });

      return {
        ok: true,
        output: {
          checksumSha256: outputChecksum,
          height: rendered.height,
          mimeType: rendered.contentType,
          objectKey: keys.output,
          outputFormat: job.options.outputFormat,
          previewObjectKey: keys.preview,
          sizeBytes: BigInt(rendered.bytes.byteLength),
          width: rendered.width,
        },
        providerLatencyMilliseconds,
        providerRequestId,
      };
    } catch (error) {
      reportUnexpectedError(error, ApplicationErrorCode.S3_UPLOAD_FAILED);
      return this.failure("NETWORK", STORAGE_FAILURE_MESSAGE);
    }
  }

  private failure(
    kind: ProcessingExecutionFailure["kind"],
    errorMessage: string,
    providerLatencyMilliseconds: number | null = null,
    providerRequestId: string | null = null,
  ): ProcessingExecutionResult {
    return {
      ok: false,
      failure: {
        errorMessage,
        kind,
        providerLatencyMilliseconds,
        providerRequestId,
      },
    };
  }
}
