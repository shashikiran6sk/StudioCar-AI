import {
  LeonardoImageUrlSchema,
  LeonardoResponseSchema,
  LeonardoSizeSchema,
} from "@studiocar/contracts";
import { logger } from "@studiocar/observability";
import type {
  BackgroundRemovalProvider,
  ProcessImageInput,
  ProcessImageResult,
  ProcessingFailureKind,
} from "@studiocar/processing";
import sharp from "sharp";
import { createLeonardoRequest } from "./create-leonardo-request";
import {
  LEONARDO_MINIMUM_TIMEOUT_MS,
  LEONARDO_MAXIMUM_TIMEOUT_MS,
  LEONARDO_DEFAULT_SIZE,
  LEONARDO_ENDPOINT,
  LEONARDO_EVENTS,
  LEONARDO_FORMAT,
  LEONARDO_JSON_CONTENT_TYPE,
  LEONARDO_MAXIMUM_JSON_BYTES,
  LEONARDO_MESSAGES,
  LEONARDO_PROVIDER_KEY,
} from "./leonardo-provider.constants";
import type {
  LeonardoProviderOptions,
  SourceImageUrlResolver,
} from "./leonardo-provider.types";
import { readBoundedResponse } from "./read-bounded-response";

export class LeonardoProvider implements BackgroundRemovalProvider {
  public readonly key = LEONARDO_PROVIDER_KEY;

  public constructor(
    private readonly options: LeonardoProviderOptions,
    private readonly resolveSourceUrl: SourceImageUrlResolver,
    private readonly fetcher: typeof fetch = fetch,
    private readonly now: () => number = Date.now,
  ) {
    if (
      !options.apiKey.trim() ||
      !Number.isSafeInteger(options.maximumOutputBytes) ||
      options.maximumOutputBytes < 1 ||
      !Number.isSafeInteger(options.maximumPixels) ||
      options.maximumPixels < 1 ||
      !Number.isSafeInteger(options.timeoutMilliseconds) ||
      options.timeoutMilliseconds < LEONARDO_MINIMUM_TIMEOUT_MS ||
      options.timeoutMilliseconds > LEONARDO_MAXIMUM_TIMEOUT_MS ||
      !LeonardoSizeSchema.safeParse(options.size ?? LEONARDO_DEFAULT_SIZE)
        .success
    ) {
      throw new Error(LEONARDO_MESSAGES.options);
    }
  }

  public async process(input: ProcessImageInput): Promise<ProcessImageResult> {
    const startedAt = this.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, this.options.timeoutMilliseconds);
    const size = this.options.size ?? LEONARDO_DEFAULT_SIZE;
    let generationId: string | null = null;
    let statusCode: number | undefined;
    let phase: "source" | "request" | "download" = "source";
    const fields = {
      provider: "leonardo",
      jobId: input.idempotencyKey,
      ...input.context,
      size,
      format: LEONARDO_FORMAT,
    };
    const failure = (
      kind: ProcessingFailureKind,
      errorMessage: string,
    ): ProcessImageResult => {
      logger.log("error", LEONARDO_EVENTS.failed, {
        ...fields,
        statusCode,
        errorCode: kind,
        providerGenerationId: generationId ?? undefined,
        durationMs: this.now() - startedAt,
      });
      return {
        ok: false,
        failure: {
          kind,
          errorMessage,
          providerLatencyMilliseconds: this.now() - startedAt,
          providerRequestId: generationId,
        },
      };
    };
    try {
      if (!input.sourceObjectKey)
        return failure("INVALID_REQUEST", LEONARDO_MESSAGES.request);
      const source = LeonardoImageUrlSchema.safeParse(
        await this.resolveSourceUrl(input.sourceObjectKey),
      );
      if (!source.success)
        return failure("INVALID_REQUEST", LEONARDO_MESSAGES.request);
      phase = "request";
      logger.log("info", LEONARDO_EVENTS.started, fields);
      const response = await this.fetcher(LEONARDO_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`,
          "Content-Type": LEONARDO_JSON_CONTENT_TYPE,
          Accept: LEONARDO_JSON_CONTENT_TYPE,
        },
        body: JSON.stringify(createLeonardoRequest(source.data, size)),
        signal: controller.signal,
        redirect: "error",
      });
      statusCode = response.status;
      if (!response.ok) {
        await response.body?.cancel();
        if (response.status === 401 || response.status === 403)
          return failure("AUTHORIZATION", LEONARDO_MESSAGES.authorization);
        if (response.status === 402)
          return failure("PAYMENT_REQUIRED", LEONARDO_MESSAGES.payment);
        if (response.status === 429)
          return failure("PROVIDER_429", LEONARDO_MESSAGES.rateLimit);
        if (response.status >= 500)
          return failure("PROVIDER_5XX", LEONARDO_MESSAGES.unavailable);
        return failure("INVALID_REQUEST", LEONARDO_MESSAGES.request);
      }
      const jsonBytes = await readBoundedResponse(
        response,
        LEONARDO_MAXIMUM_JSON_BYTES,
      );
      let payload: unknown;
      try {
        payload = jsonBytes
          ? JSON.parse(new TextDecoder().decode(jsonBytes))
          : null;
      } catch {
        return failure("INVALID_REQUEST", LEONARDO_MESSAGES.response);
      }
      const parsed = LeonardoResponseSchema.safeParse(payload);
      if (!parsed.success)
        return failure("INVALID_REQUEST", LEONARDO_MESSAGES.response);
      generationId = parsed.data.id;
      const result = parsed.data.results[0];
      if (!result)
        return failure("INVALID_REQUEST", LEONARDO_MESSAGES.response);
      // Record the charged generation before downloading; a failed download still incurred this cost.
      logger.log("info", LEONARDO_EVENTS.generated, {
        ...fields,
        providerGenerationId: generationId,
        width: result.width,
        height: result.height,
        cost: parsed.data.cost,
        durationMs: this.now() - startedAt,
      });
      phase = "download";
      const download = await this.fetcher(result.url, {
        signal: controller.signal,
        redirect: "error",
      });
      statusCode = download.status;
      if (!download.ok) {
        await download.body?.cancel();
        return failure("NETWORK", LEONARDO_MESSAGES.download);
      }
      const contentType = download.headers
        .get("content-type")
        ?.split(";")[0]
        ?.trim()
        .toLowerCase();
      if (contentType !== result.contentType) {
        await download.body?.cancel();
        return failure("INVALID_IMAGE", LEONARDO_MESSAGES.image);
      }
      const bytes = await readBoundedResponse(
        download,
        this.options.maximumOutputBytes,
      );
      if (!bytes) return failure("INVALID_IMAGE", LEONARDO_MESSAGES.image);
      let output: Uint8Array;
      let width: number;
      let height: number;
      try {
        const image = sharp(bytes, {
          failOn: "warning",
          limitInputPixels: this.options.maximumPixels,
          pages: 1,
        });
        const metadata = await image.metadata();
        if (
          !metadata.width ||
          !metadata.height ||
          !metadata.hasAlpha ||
          (metadata.pages !== undefined && metadata.pages !== 1) ||
          `image/${metadata.format}` !== result.contentType ||
          (result.width !== undefined && result.width !== metadata.width) ||
          (result.height !== undefined && result.height !== metadata.height)
        )
          return failure("INVALID_IMAGE", LEONARDO_MESSAGES.image);
        await image.clone().stats();
        output =
          result.contentType === "image/webp"
            ? bytes
            : await image.webp({ lossless: true }).toBuffer();
        if (output.byteLength > this.options.maximumOutputBytes)
          return failure("INVALID_IMAGE", LEONARDO_MESSAGES.image);
        width = metadata.width;
        height = metadata.height;
      } catch {
        return failure("INVALID_IMAGE", LEONARDO_MESSAGES.image);
      }
      const durationMs = this.now() - startedAt;
      logger.log("info", LEONARDO_EVENTS.completed, {
        ...fields,
        providerGenerationId: generationId,
        width,
        height,
        durationMs,
        sizeBytes: output.byteLength,
      });
      return {
        ok: true,
        result: {
          bytes: output,
          contentType: "image/webp",
          providerRequestId: generationId,
          providerLatencyMilliseconds: durationMs,
        },
      };
    } catch {
      return failure(
        controller.signal.aborted ? "TIMEOUT" : "NETWORK",
        controller.signal.aborted
          ? LEONARDO_MESSAGES.timeout
          : phase === "download"
            ? LEONARDO_MESSAGES.download
            : LEONARDO_MESSAGES.network,
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
