import { LOG_EVENTS } from "@studiocar/observability";
import {
  emitOperationalEvent,
  logger,
  OperationalTelemetry,
  type OperationalTelemetryPort,
} from "@studiocar/observability";
import { classifyRemoveBgError } from "./classify-remove-bg-error";
import { createRemoveBgOperationalEvent } from "./create-remove-bg-operational-event";
import { readRemoveBgCredits } from "./read-remove-bg-credits";
import type {
  BackgroundRemovalProvider,
  ProcessImageInput,
  ProcessImageResult,
} from "@studiocar/processing";

import {
  REMOVE_BG_API_KEY_HEADER,
  REMOVE_BG_CONTENT_TYPE_HEADER,
  REMOVE_BG_ENDPOINT,
  REMOVE_BG_FORMAT_FIELD,
  REMOVE_BG_FORMAT_VALUE,
  REMOVE_BG_IMAGE_FIELD,
  REMOVE_BG_INVALID_RESPONSE_MESSAGE,
  REMOVE_BG_METHOD,
  REMOVE_BG_NETWORK_MESSAGE,
  REMOVE_BG_PROVIDER_KEY,
  REMOVE_BG_RESPONSE_CONTENT_TYPE,
  REMOVE_BG_SHADOW_TYPE_FIELD,
  REMOVE_BG_SIZE_FIELD,
  REMOVE_BG_SIZE_VALUE,
  REMOVE_BG_SOURCE_FILENAME,
  REMOVE_BG_TAG_FIELD,
  REMOVE_BG_TIMEOUT_MESSAGE,
  REMOVE_BG_TYPE_FIELD,
  REMOVE_BG_TYPE_VALUE,
} from "./remove-bg-provider.constants";
import type { RemoveBgProviderOptions } from "./remove-bg-provider.types";
import { readRemoveBgErrorCode } from "./read-remove-bg-error-code";
import { readRemoveBgRequestId } from "./read-remove-bg-request-id";
import { toRemoveBgFailure } from "./to-remove-bg-failure";
import { toRemoveBgShadowType } from "./to-remove-bg-shadow-type";
import { validateRemoveBgProviderOptions } from "./validate-remove-bg-provider-options";

export class RemoveBgProvider implements BackgroundRemovalProvider {
  public readonly key = REMOVE_BG_PROVIDER_KEY;

  public constructor(
    private readonly options: RemoveBgProviderOptions,
    private readonly fetcher: typeof fetch = fetch,
    private readonly now: () => number = Date.now,
    private readonly telemetry: OperationalTelemetryPort = new OperationalTelemetry(),
  ) {
    validateRemoveBgProviderOptions(options);
  }

  public async process(input: ProcessImageInput): Promise<ProcessImageResult> {
    const metricStartedAt = performance.now();
    let statusCode: number | undefined;
    let creditsCharged: number | undefined;
    let providerRequestId: string | null = null;
    let success = false;
    let caughtError: unknown;
    logger.log("info", LOG_EVENTS.REMOVE_BG_STARTED, { provider: "remove.bg" });
    emitOperationalEvent(
      this.telemetry,
      createRemoveBgOperationalEvent({ phase: "started" }),
    );
    const startedAt = this.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, this.options.timeoutMilliseconds);

    try {
      const form = new FormData();
      form.append(REMOVE_BG_SIZE_FIELD, REMOVE_BG_SIZE_VALUE);
      form.append(REMOVE_BG_TYPE_FIELD, REMOVE_BG_TYPE_VALUE);
      form.append(REMOVE_BG_FORMAT_FIELD, REMOVE_BG_FORMAT_VALUE);
      form.append(REMOVE_BG_TAG_FIELD, input.idempotencyKey);
      form.append(
        REMOVE_BG_SHADOW_TYPE_FIELD,
        toRemoveBgShadowType(input.shadow),
      );
      form.append(
        REMOVE_BG_IMAGE_FIELD,
        new Blob([Uint8Array.from(input.bytes)], { type: input.contentType }),
        REMOVE_BG_SOURCE_FILENAME,
      );
      const response = await this.fetcher(REMOVE_BG_ENDPOINT, {
        body: form,
        headers: { [REMOVE_BG_API_KEY_HEADER]: this.options.apiKey },
        method: REMOVE_BG_METHOD,
        signal: controller.signal,
      });
      statusCode = response.status;
      creditsCharged = response.ok
        ? readRemoveBgCredits(response.headers)
        : undefined;
      const providerLatencyMilliseconds = this.now() - startedAt;
      providerRequestId = readRemoveBgRequestId(response.headers);
      if (!response.ok) {
        const providerErrorCode = await readRemoveBgErrorCode(response);
        return {
          ok: false,
          failure: toRemoveBgFailure(
            response.status,
            providerLatencyMilliseconds,
            providerRequestId,
            providerErrorCode,
          ),
        };
      }

      const contentType = response.headers
        .get(REMOVE_BG_CONTENT_TYPE_HEADER)
        ?.toLowerCase();
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (
        !contentType?.startsWith(REMOVE_BG_RESPONSE_CONTENT_TYPE) ||
        bytes.byteLength === 0 ||
        bytes.byteLength > this.options.maximumOutputBytes
      ) {
        return {
          ok: false,
          failure: {
            errorMessage: REMOVE_BG_INVALID_RESPONSE_MESSAGE,
            kind: "PROVIDER_5XX",
            providerLatencyMilliseconds,
            providerRequestId,
          },
        };
      }
      success = true;
      return {
        ok: true,
        result: {
          bytes,
          contentType: REMOVE_BG_RESPONSE_CONTENT_TYPE,
          providerLatencyMilliseconds,
          providerRequestId,
        },
      };
    } catch (error) {
      caughtError = error;
      const timedOut = controller.signal.aborted;
      return {
        ok: false,
        failure: {
          errorMessage: timedOut
            ? REMOVE_BG_TIMEOUT_MESSAGE
            : REMOVE_BG_NETWORK_MESSAGE,
          kind: timedOut ? "TIMEOUT" : "NETWORK",
          providerLatencyMilliseconds: this.now() - startedAt,
          providerRequestId: null,
        },
      };
    } finally {
      clearTimeout(timeout);
      const durationMs = Math.max(0, performance.now() - metricStartedAt);
      logger.log(
        success ? "info" : "error",
        success ? LOG_EVENTS.REMOVE_BG_COMPLETED : LOG_EVENTS.REMOVE_BG_FAILED,
        {
          provider: "remove.bg",
          durationMs,
          statusCode,
          creditsCharged,
          providerRequestId: providerRequestId ?? undefined,
          ...(success
            ? {}
            : {
                errorCode: classifyRemoveBgError(statusCode),
                ...(caughtError !== undefined ? { error: caughtError } : {}),
              }),
        },
      );
      emitOperationalEvent(
        this.telemetry,
        createRemoveBgOperationalEvent({
          phase: "finished",
          success,
          statusCode,
          durationMs,
          creditsCharged,
        }),
      );
    }
  }
}
