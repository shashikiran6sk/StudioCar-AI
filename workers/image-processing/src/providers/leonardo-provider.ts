import {
  LeonardoImageUrlSchema,
  LeonardoResponseSchema,
  type LeonardoCost,
} from "@studiocar/contracts";
import {
  emitOperationalEvent,
  logger,
  OperationalTelemetry,
  type OperationalTelemetryPort,
} from "@studiocar/observability";
import {
  classifyProcessingFailure,
  type BackgroundRemovalRequest,
  type BackgroundRemovalResult,
  type ImageProcessingProvider,
} from "@studiocar/processing";

import { classifyProviderStatus } from "./classify-provider-status";
import { createLeonardoRequest } from "./create-leonardo-request";
import { createProviderOperationalEvent } from "./create-provider-operational-event";
import {
  LEONARDO_ACCEPTED_DOWNLOAD_CONTENT_TYPES,
  LEONARDO_JSON_CONTENT_TYPE,
  LEONARDO_LOG_PROVIDER,
  LEONARDO_MAXIMUM_JSON_BYTES,
  LEONARDO_MAXIMUM_TIMEOUT_MS,
  LEONARDO_MINIMUM_TIMEOUT_MS,
  LEONARDO_OPTIONS_ERROR,
  LEONARDO_OUTPUT_CONTENT_TYPE,
  LEONARDO_OUTPUT_FORMAT,
  LEONARDO_PROVIDER_KEY,
  LEONARDO_RETRY_AFTER_HEADER,
  LEONARDO_SIZE_BY_QUALITY_TIER,
  LEONARDO_SYNC_ENDPOINT,
} from "./leonardo-provider.constants";
import type {
  LeonardoProviderOptions,
  SourceImageUrlResolver,
} from "./leonardo-provider.types";
import type { ProviderFailureCategory } from "./provider-failure.types";
import { PROVIDER_FAILURES } from "./provider-failures.constants";
import { PROVIDER_LOG_EVENTS } from "./provider-telemetry.constants";
import { readBoundedResponse } from "./read-bounded-response";
import { readRetryAfter } from "./read-retry-after";
import { selectLeonardoResult } from "./select-leonardo-result";
import { validateProviderCutout } from "./validate-provider-cutout";

interface ExchangeState {
  cost: LeonardoCost | null;
  generationId: string | null;
  startedAt: number;
  statusCode: number | undefined;
}

/**
 * Leonardo.Ai Remove Background through the Sync API. The Lambda already runs
 * asynchronously behind SQS, so it waits for this one image: no Async API, no
 * webhook. The source is a short-lived presigned URL minted per attempt; the
 * temporary result is downloaded immediately, validated and handed back as
 * bytes for StudioCar's own storage. No URL, key or body is ever logged.
 *
 * There is no retry loop here. Every failure is classified once and the
 * worker's durable, bounded retry decides what happens next, honouring any
 * `Retry-After` the provider sent.
 */
export class LeonardoProvider implements ImageProcessingProvider {
  public readonly key = LEONARDO_PROVIDER_KEY;

  public constructor(
    private readonly options: LeonardoProviderOptions,
    private readonly resolveSourceUrl: SourceImageUrlResolver,
    private readonly fetcher: typeof fetch = fetch,
    private readonly now: () => number = Date.now,
    private readonly telemetry: OperationalTelemetryPort = new OperationalTelemetry(),
  ) {
    if (
      !options.apiKey.trim() ||
      !Number.isSafeInteger(options.maximumOutputBytes) ||
      options.maximumOutputBytes < 1 ||
      !Number.isSafeInteger(options.maximumPixels) ||
      options.maximumPixels < 1 ||
      !Number.isSafeInteger(options.timeoutMilliseconds) ||
      options.timeoutMilliseconds < LEONARDO_MINIMUM_TIMEOUT_MS ||
      options.timeoutMilliseconds > LEONARDO_MAXIMUM_TIMEOUT_MS
    ) {
      throw new RangeError(LEONARDO_OPTIONS_ERROR);
    }
  }

  public async removeBackground(
    request: BackgroundRemovalRequest,
  ): Promise<BackgroundRemovalResult> {
    const size = LEONARDO_SIZE_BY_QUALITY_TIER[request.qualityTier];
    const fields = {
      provider: LEONARDO_LOG_PROVIDER,
      jobId: request.jobId,
      assetId: request.correlation.assetId,
      vehicleId: request.correlation.vehicleId,
      attempt: request.correlation.attempt,
      size,
      format: LEONARDO_OUTPUT_FORMAT,
    };
    const state: ExchangeState = {
      cost: null,
      generationId: null,
      startedAt: this.now(),
      statusCode: undefined,
    };
    const fail = (
      category: ProviderFailureCategory,
      retryAfterMilliseconds: number | null = null,
    ): BackgroundRemovalResult => {
      const durationMs = this.finish(state, category);
      logger.log("error", PROVIDER_LOG_EVENTS.failed, {
        ...fields,
        durationMs,
        errorCode: classifyProcessingFailure(PROVIDER_FAILURES[category].kind)
          .errorCode,
        outcome: category,
        providerGenerationId: state.generationId ?? undefined,
        statusCode: state.statusCode,
      });
      return {
        ok: false,
        failure: {
          errorMessage: PROVIDER_FAILURES[category].message,
          kind: PROVIDER_FAILURES[category].kind,
          providerLatencyMilliseconds: durationMs,
          providerRequestId: state.generationId,
          retryAfterMilliseconds,
        },
      };
    };

    let sourceUrl: string;
    try {
      sourceUrl = await this.resolveSourceUrl(request.sourceObjectKey);
    } catch {
      return fail("SOURCE_UNAVAILABLE");
    }
    if (!LeonardoImageUrlSchema.safeParse(sourceUrl).success) {
      return fail("SOURCE_UNAVAILABLE");
    }

    const controller = new AbortController();
    const deadline = setTimeout(() => {
      controller.abort();
    }, this.options.timeoutMilliseconds);
    let downloading = false;
    try {
      logger.log("info", PROVIDER_LOG_EVENTS.started, fields);
      const response = await this.fetcher(LEONARDO_SYNC_ENDPOINT, {
        method: "POST",
        headers: {
          Accept: LEONARDO_JSON_CONTENT_TYPE,
          Authorization: `Bearer ${this.options.apiKey}`,
          "Content-Type": LEONARDO_JSON_CONTENT_TYPE,
        },
        body: JSON.stringify(createLeonardoRequest(sourceUrl, size)),
        redirect: "error",
        signal: controller.signal,
      });
      state.statusCode = response.status;
      if (!response.ok) {
        const retryAfter = readRetryAfter(
          response.headers,
          LEONARDO_RETRY_AFTER_HEADER,
          this.now(),
        );
        await response.body?.cancel();
        return fail(classifyProviderStatus(response.status), retryAfter);
      }

      const json = await readBoundedResponse(
        response,
        LEONARDO_MAXIMUM_JSON_BYTES,
      );
      let payload: unknown;
      try {
        payload = json === null ? null : JSON.parse(new TextDecoder().decode(json));
      } catch {
        return fail("INVALID_RESPONSE");
      }
      const parsed = LeonardoResponseSchema.safeParse(payload);
      if (!parsed.success) return fail("INVALID_RESPONSE");
      state.generationId = parsed.data.id;
      state.cost = parsed.data.cost ?? null;
      // Recorded before the download: a result that later fails to download
      // or validate has still been charged.
      logger.log("info", PROVIDER_LOG_EVENTS.generated, {
        ...fields,
        cost: parsed.data.cost,
        durationMs: this.now() - state.startedAt,
        providerGenerationId: state.generationId,
      });

      const result = selectLeonardoResult(parsed.data.results);
      if (!result.ok) return fail(result.category);

      downloading = true;
      state.statusCode = undefined;
      // A temporary result carries its own authorization; the API key is
      // never sent to the result host.
      const download = await this.fetcher(result.url, {
        redirect: "error",
        signal: controller.signal,
      });
      state.statusCode = download.status;
      if (!download.ok) {
        await download.body?.cancel();
        return fail("DOWNLOAD_FAILED");
      }
      const contentType = download.headers
        .get("content-type")
        ?.split(";")[0]
        ?.trim()
        .toLowerCase();
      if (
        contentType !== undefined &&
        !LEONARDO_ACCEPTED_DOWNLOAD_CONTENT_TYPES.includes(contentType)
      ) {
        await download.body?.cancel();
        return fail("INVALID_OUTPUT");
      }
      const bytes = await readBoundedResponse(
        download,
        this.options.maximumOutputBytes,
      );
      if (bytes === null) return fail("INVALID_OUTPUT");
      const cutout = await validateProviderCutout(bytes, {
        height: result.height,
        maximumPixels: this.options.maximumPixels,
        width: result.width,
      });
      if (cutout === null) return fail("INVALID_OUTPUT");

      const durationMs = this.finish(state, null);
      logger.log("info", PROVIDER_LOG_EVENTS.completed, {
        ...fields,
        durationMs,
        height: cutout.height,
        providerGenerationId: state.generationId,
        sizeBytes: bytes.byteLength,
        width: cutout.width,
      });
      return {
        ok: true,
        cutout: {
          bytes,
          contentType: LEONARDO_OUTPUT_CONTENT_TYPE,
          height: cutout.height,
          providerLatencyMilliseconds: durationMs,
          providerRequestId: state.generationId,
          width: cutout.width,
        },
      };
    } catch {
      if (controller.signal.aborted) return fail("TIMEOUT");
      return fail(downloading ? "DOWNLOAD_FAILED" : "NETWORK");
    } finally {
      clearTimeout(deadline);
    }
  }

  /** Emits the exchange's metrics and returns its duration. */
  private finish(
    state: ExchangeState,
    failureCategory: ProviderFailureCategory | null,
  ): number {
    const finishedAtMilliseconds = this.now();
    const durationMilliseconds = Math.max(
      0,
      finishedAtMilliseconds - state.startedAt,
    );
    emitOperationalEvent(
      this.telemetry,
      createProviderOperationalEvent({
        cost: state.cost,
        durationMilliseconds,
        failureCategory,
        finishedAtMilliseconds,
      }),
    );
    return durationMilliseconds;
  }
}
