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
  ) {
    validateRemoveBgProviderOptions(options);
  }

  public async process(input: ProcessImageInput): Promise<ProcessImageResult> {
    const startedAt = this.now();
    const controller = new AbortController();
    const timeout = setTimeout(
      () => {
        controller.abort();
      },
      this.options.timeoutMilliseconds,
    );

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
      const providerLatencyMilliseconds = this.now() - startedAt;
      const providerRequestId = readRemoveBgRequestId(response.headers);
      if (!response.ok) {
        return {
          ok: false,
          failure: toRemoveBgFailure(
            response.status,
            providerLatencyMilliseconds,
            providerRequestId,
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
      return {
        ok: true,
        result: {
          bytes,
          contentType: REMOVE_BG_RESPONSE_CONTENT_TYPE,
          providerLatencyMilliseconds,
          providerRequestId,
        },
      };
    } catch {
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
    }
  }
}
