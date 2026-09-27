import {
  LeonardoResponseSchema,
  LeonardoSizeSchema,
} from "@studiocar/contracts";
import sharp from "sharp";
import { LeonardoProvider } from "../providers/leonardo-provider";
import {
  LEONARDO_ENDPOINT,
  LEONARDO_MAXIMUM_JSON_BYTES,
} from "../providers/leonardo-provider.constants";
import type {
  LeonardoProviderOptions,
  SourceImageUrlResolver,
} from "../providers/leonardo-provider.types";
import { readBoundedResponse } from "../providers/read-bounded-response";

/** Three sequential, paid calls to the same source. No pricing assumptions or retries. */
export async function measureLeonardoCost(
  sourceObjectKey: string,
  options: LeonardoProviderOptions,
  resolveSourceUrl: SourceImageUrlResolver,
  fetcher: typeof fetch = fetch,
) {
  const measurements = [];
  for (const mode of LeonardoSizeSchema.options) {
    let cost: unknown = null;
    let downloadedFileSize = 0;
    let contentType: string | null = null;
    const measuredFetch: typeof fetch = async (url, init) => {
      const response = await fetcher(url, init);
      if (url === LEONARDO_ENDPOINT && response.ok) {
        const bytes = await readBoundedResponse(
          response.clone(),
          LEONARDO_MAXIMUM_JSON_BYTES,
        );
        if (bytes) {
          const payload: unknown = JSON.parse(new TextDecoder().decode(bytes));
          const parsed = LeonardoResponseSchema.safeParse(payload);
          if (parsed.success) cost = parsed.data.cost ?? null;
        }
      }
      if (url !== LEONARDO_ENDPOINT && response.ok) {
        const bytes = await readBoundedResponse(
          response.clone(),
          options.maximumOutputBytes,
        );
        downloadedFileSize = bytes?.byteLength ?? 0;
        contentType = response.headers.get("content-type");
      }
      return response;
    };
    const provider = new LeonardoProvider(
      { ...options, size: mode },
      resolveSourceUrl,
      measuredFetch,
    );
    const result = await provider.process({
      bytes: new Uint8Array(),
      contentType: "image/jpeg",
      sourceObjectKey,
      idempotencyKey: `cost-experiment-${mode}`,
      shadow: "NONE",
    });
    if (!result.ok)
      throw new Error(
        `Leonardo cost experiment failed: ${mode} / ${result.failure.kind}`,
      );
    const metadata = await sharp(result.result.bytes).metadata();
    measurements.push({
      mode,
      width: metadata.width,
      height: metadata.height,
      contentType,
      cost,
      latencyMilliseconds: result.result.providerLatencyMilliseconds,
      downloadedFileSize,
    });
  }
  return measurements;
}
