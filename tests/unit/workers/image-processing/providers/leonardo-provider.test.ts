import sharp from "sharp";
import { afterEach, describe, expect, it, vi } from "vitest";

import type {
  OperationalEvent,
  OperationalTelemetryPort,
} from "../../../../../packages/observability/src/operational-telemetry.types";
import { logger } from "../../../../../packages/observability/src/structured-logger";
import type { BackgroundRemovalRequest } from "../../../../../packages/processing/src/image-processing-provider.types";
import type { ProcessingQualityTier } from "../../../../../packages/processing/src/processing-worker.types";
import { LeonardoProvider } from "../../../../../workers/image-processing/src/providers/leonardo-provider";
import type { LeonardoProviderOptions } from "../../../../../workers/image-processing/src/providers/leonardo-provider.types";

const SOURCE_URL =
  "https://bucket.s3.ap-south-1.amazonaws.com/users/u/source.jpg?X-Amz-Signature=source-secret";
const RESULT_URL = "https://cdn.leonardo.example/cutout.webp?token=result-secret";
const API_KEY = "api-secret";
const OPTIONS: LeonardoProviderOptions = {
  apiKey: API_KEY,
  maximumOutputBytes: 1024 * 1024,
  maximumPixels: 1_000_000,
  timeoutMilliseconds: 1_000,
};
const REQUEST: BackgroundRemovalRequest = {
  correlation: { assetId: "asset-1", attempt: 2, vehicleId: "vehicle-1" },
  jobId: "job-1",
  qualityTier: "HIGH",
  sourceObjectKey: "users/owner/source.jpg",
};
const PAYLOAD = {
  id: "generation-1",
  cost: { amount: "0.0425", unit: "DOLLARS" },
  results: [
    { url: RESULT_URL, contentType: "image/webp", width: 30, height: 20 },
  ],
};

interface Call {
  init: RequestInit | undefined;
  url: string;
}

async function cutoutBytes(
  format: "webp" | "png" = "webp",
  channels: 3 | 4 = 4,
): Promise<Buffer> {
  const image = sharp({
    create: {
      background:
        channels === 4
          ? { alpha: 0.5, b: 30, g: 20, r: 10 }
          : { b: 30, g: 20, r: 10 },
      channels,
      height: 20,
      width: 30,
    },
  });
  return format === "webp" ? image.webp().toBuffer() : image.png().toBuffer();
}

class RecordingTelemetry implements OperationalTelemetryPort {
  public readonly events: OperationalEvent[] = [];

  public emit(event: OperationalEvent): boolean {
    this.events.push(event);
    return true;
  }
}

function metricNames(telemetry: RecordingTelemetry): string[] {
  return telemetry.events.flatMap((event) =>
    event.metrics.map((metric) => metric.name),
  );
}

async function run(
  respond: (call: Call, index: number) => Response | Promise<Response>,
  overrides: {
    qualityTier?: ProcessingQualityTier;
    resolver?: () => Promise<string>;
  } = {},
) {
  const calls: Call[] = [];
  const telemetry = new RecordingTelemetry();
  const fetcher: typeof fetch = (url, init) => {
    const call = { init, url: String(url) };
    calls.push(call);
    return Promise.resolve(respond(call, calls.length - 1));
  };
  const provider = new LeonardoProvider(
    OPTIONS,
    overrides.resolver ?? (() => Promise.resolve(SOURCE_URL)),
    fetcher,
    Date.now,
    telemetry,
  );
  const result = await provider.removeBackground({
    ...REQUEST,
    qualityTier: overrides.qualityTier ?? REQUEST.qualityTier,
  });
  return { calls, result, telemetry };
}

async function successResponses(
  download?: () => Promise<Response>,
): Promise<(call: Call, index: number) => Response | Promise<Response>> {
  const bytes = await cutoutBytes();
  return (_call, index) =>
    index === 0
      ? Response.json(PAYLOAD)
      : (download?.() ??
        new Response(bytes, { headers: { "content-type": "image/webp" } }));
}

function requestBody(calls: Call[]): unknown {
  const body = calls[0]?.init?.body;
  if (typeof body !== "string") throw new Error("Expected a JSON body.");
  return JSON.parse(body);
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("LeonardoProvider request", () => {
  it("calls the Sync endpoint with Bearer auth and the full remove-bg car request", async () => {
    const { calls, result } = await run(await successResponses());

    expect(result.ok).toBe(true);
    expect(calls[0]?.url).toBe(
      "https://cloud.leonardo.ai/api/rest/v2/generationssync",
    );
    expect(calls[0]?.init?.method).toBe("POST");
    expect(calls[0]?.init?.redirect).toBe("error");
    const headers = new Headers(calls[0]?.init?.headers);
    expect(headers.get("Authorization")).toBe(`Bearer ${API_KEY}`);
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(headers.get("Accept")).toBe("application/json");
    expect(requestBody(calls)).toEqual({
      model: "remove-bg",
      public: false,
      ephemeral: true,
      parameters: {
        size: "auto",
        type: "car",
        format: "webp",
        channels: "rgba",
        crop: false,
        shadow_type: "car",
        semitransparency: true,
        guidances: {
          image_reference: [{ image: { type: "URL", url: SOURCE_URL } }],
        },
      },
    });
    expect(String(calls[0]?.init?.body)).not.toContain(
      "background_image_reference",
    );
  });

  it.each([
    ["STANDARD", "preview"],
    ["HIGH", "auto"],
  ] as const)("requests Leonardo size for the %s tier: %s", async (qualityTier, size) => {
    const { calls } = await run(await successResponses(), { qualityTier });
    expect(requestBody(calls)).toMatchObject({ parameters: { size } });
  });

  it("downloads the temporary result immediately, without credentials or redirects", async () => {
    const { calls } = await run(await successResponses());
    expect(calls).toHaveLength(2);
    expect(calls[1]?.url).toBe(RESULT_URL);
    expect(calls[1]?.init?.headers).toBeUndefined();
    expect(calls[1]?.init?.redirect).toBe("error");
  });
});

describe("LeonardoProvider result", () => {
  it("returns the downloaded WebP bytes unchanged, with the generation id", async () => {
    const bytes = await cutoutBytes();
    const { result } = await run(await successResponses());
    expect(result).toEqual({
      ok: true,
      cutout: {
        bytes: Uint8Array.from(bytes),
        contentType: "image/webp",
        height: 20,
        providerLatencyMilliseconds: expect.any(Number),
        providerRequestId: "generation-1",
        width: 30,
      },
    });
  });

  it.each(["application/octet-stream", "binary/octet-stream"])(
    "accepts a CDN's generic %s label when the bytes decode as WebP",
    async (contentType) => {
      const bytes = await cutoutBytes();
      const { result } = await run(
        await successResponses(() =>
          Promise.resolve(
            new Response(bytes, { headers: { "content-type": contentType } }),
          ),
        ),
      );
      expect(result.ok).toBe(true);
    },
  );
});

describe("LeonardoProvider failures", () => {
  it.each([
    [401, "AUTHORIZATION", "ProviderAuthorizationFailureCount"],
    [403, "AUTHORIZATION", "ProviderAuthorizationFailureCount"],
    [402, "PAYMENT_REQUIRED", "ProviderPaymentRequiredCount"],
    [400, "INVALID_REQUEST", "ProviderRejectedRequestCount"],
    [422, "INVALID_REQUEST", "ProviderRejectedRequestCount"],
    [408, "TIMEOUT", "ProviderTimeoutCount"],
    [429, "PROVIDER_429", "ProviderRateLimitedResponseCount"],
    [500, "PROVIDER_5XX", "ProviderServerErrorResponseCount"],
    [503, "PROVIDER_5XX", "ProviderServerErrorResponseCount"],
  ])("classifies HTTP %i as %s", async (status, kind, metric) => {
    const { calls, result, telemetry } = await run(
      () => new Response("provider details with secret", { status }),
    );
    expect(calls).toHaveLength(1);
    expect(result).toMatchObject({ ok: false, failure: { kind } });
    expect(JSON.stringify(result)).not.toContain("secret");
    expect(metricNames(telemetry)).toEqual(
      expect.arrayContaining([
        "ProviderRequestCount",
        "ProviderFailureCount",
        metric,
      ]),
    );
  });

  it("passes a 429's Retry-After to the durable retry", async () => {
    const { result } = await run(
      () =>
        new Response(null, { headers: { "retry-after": "12" }, status: 429 }),
    );
    expect(result).toMatchObject({
      ok: false,
      failure: { kind: "PROVIDER_429", retryAfterMilliseconds: 12_000 },
    });
  });

  it.each([
    ["not JSON", () => new Response("{not json", { status: 200 })],
    ["an empty body", () => new Response(null, { status: 200 })],
    ["no generation id", () => Response.json({ results: PAYLOAD.results })],
    ["no results array", () => Response.json({ id: "generation-1" })],
    ["an empty results array", () => Response.json({ id: "generation-1", results: [] })],
    [
      "two results",
      () =>
        Response.json({
          id: "generation-1",
          results: [PAYLOAD.results[0], PAYLOAD.results[0]],
        }),
    ],
    [
      "a result without a URL",
      () => Response.json({ id: "generation-1", results: [{ contentType: "image/webp" }] }),
    ],
    [
      "a plain-HTTP result URL",
      () =>
        Response.json({
          id: "generation-1",
          results: [{ url: "http://cdn.example/a.webp" }],
        }),
    ],
    [
      "a result URL with credentials",
      () =>
        Response.json({
          id: "generation-1",
          results: [{ url: "https://user:secret@cdn.example/a.webp" }],
        }),
    ],
    [
      "an oversized JSON body",
      () => new Response("x".repeat(70 * 1024), { status: 200 }),
    ],
  ])("treats a response with %s as a retryable invalid response", async (_case, respond) => {
    const { calls, result, telemetry } = await run(respond);
    expect(calls).toHaveLength(1);
    expect(result).toMatchObject({
      ok: false,
      failure: { kind: "PROVIDER_5XX", retryAfterMilliseconds: null },
    });
    expect(metricNames(telemetry)).toContain("ProviderInvalidResponseCount");
  });

  it.each([{ nsfw: true }, { blocked: true }])(
    "reports a moderated result (%o) as blocked content without downloading it",
    async (moderation) => {
      const { calls, result, telemetry } = await run(() =>
        Response.json({
          id: "generation-1",
          results: [{ ...PAYLOAD.results[0], ...moderation }],
        }),
      );
      expect(calls).toHaveLength(1);
      expect(result).toMatchObject({
        ok: false,
        failure: { kind: "CONTENT_BLOCKED", providerRequestId: "generation-1" },
      });
      expect(metricNames(telemetry)).toContain("ProviderContentBlockedCount");
    },
  );

  it("refuses a result declared as another format before downloading it", async () => {
    const { calls, result } = await run(() =>
      Response.json({
        id: "generation-1",
        results: [{ ...PAYLOAD.results[0], contentType: "image/png" }],
      }),
    );
    expect(calls).toHaveLength(1);
    expect(result).toMatchObject({ ok: false, failure: { kind: "PROVIDER_5XX" } });
  });

  it.each([
    ["an error status", () => Promise.resolve(new Response(null, { status: 404 }))],
    [
      "a network failure",
      () => Promise.reject(new TypeError("fetch failed")),
    ],
  ])("classifies a download with %s as a retryable download failure", async (_case, download) => {
    const { result, telemetry } = await run(
      await successResponses(download),
    );
    expect(result).toMatchObject({
      ok: false,
      failure: { kind: "NETWORK", providerRequestId: "generation-1" },
    });
    expect(metricNames(telemetry)).toContain("ProviderDownloadFailureCount");
  });

  it.each([
    [
      "an HTML page",
      async () =>
        new Response("<html></html>", {
          headers: { "content-type": "text/html" },
        }),
    ],
    [
      "PNG bytes",
      async () =>
        new Response(await cutoutBytes("png"), {
          headers: { "content-type": "image/webp" },
        }),
    ],
    [
      "a WebP without alpha",
      async () =>
        new Response(await cutoutBytes("webp", 3), {
          headers: { "content-type": "image/webp" },
        }),
    ],
    [
      "undecodable bytes",
      async () =>
        new Response(new Uint8Array([1, 2, 3, 4]), {
          headers: { "content-type": "image/webp" },
        }),
    ],
    [
      "an oversized file",
      async () =>
        new Response(new Uint8Array(OPTIONS.maximumOutputBytes + 1), {
          headers: { "content-type": "image/webp" },
        }),
    ],
    ["an empty file", async () => new Response(new Uint8Array(0))],
  ])("refuses %s as an unusable output that retries", async (_case, download) => {
    const { result, telemetry } = await run(await successResponses(download));
    expect(result).toMatchObject({ ok: false, failure: { kind: "PROVIDER_5XX" } });
    expect(metricNames(telemetry)).toContain("ProviderInvalidOutputCount");
  });

  it("refuses an output whose dimensions differ from those declared", async () => {
    const { result } = await run(async (_call, index) =>
      index === 0
        ? Response.json({
            ...PAYLOAD,
            results: [{ ...PAYLOAD.results[0], width: 31 }],
          })
        : new Response(await cutoutBytes(), {
            headers: { "content-type": "image/webp" },
          }),
    );
    expect(result).toMatchObject({ ok: false, failure: { kind: "PROVIDER_5XX" } });
  });

  it("classifies an unreachable provider as a retryable network failure", async () => {
    const { result, telemetry } = await run(() => {
      throw new TypeError("fetch failed");
    });
    expect(result).toMatchObject({ ok: false, failure: { kind: "NETWORK" } });
    expect(metricNames(telemetry)).toContain("ProviderNetworkErrorCount");
  });

  it("aborts at the deadline and reports a retryable timeout", async () => {
    vi.useFakeTimers();
    const telemetry = new RecordingTelemetry();
    const provider = new LeonardoProvider(
      OPTIONS,
      () => Promise.resolve(SOURCE_URL),
      (_url, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("aborted", "AbortError"));
          });
        }),
      Date.now,
      telemetry,
    );
    const pending = provider.removeBackground(REQUEST);
    await vi.advanceTimersByTimeAsync(OPTIONS.timeoutMilliseconds);
    await expect(pending).resolves.toMatchObject({
      ok: false,
      failure: { kind: "TIMEOUT" },
    });
    expect(metricNames(telemetry)).toContain("ProviderTimeoutCount");
  });

  it.each([
    ["the presigner fails", () => Promise.reject(new Error("no credentials"))],
    ["the URL is not HTTPS", () => Promise.resolve("http://minio:9000/source.jpg")],
  ])("never calls Leonardo when %s", async (_case, resolver) => {
    const { calls, result, telemetry } = await run(() => Response.json(PAYLOAD), {
      resolver,
    });
    expect(calls).toHaveLength(0);
    expect(result).toMatchObject({ ok: false, failure: { kind: "NETWORK" } });
    expect(metricNames(telemetry)).toContain("ProviderSourceUnavailableCount");
  });
});

describe("LeonardoProvider observability", () => {
  it("records one exchange with its latency and reported cost, and no identifiers as dimensions", async () => {
    const { telemetry } = await run(await successResponses());
    expect(telemetry.events).toHaveLength(1);
    const [event] = telemetry.events;
    expect(event?.dimensions).toEqual({ Provider: "Leonardo" });
    expect(event?.metrics).toEqual(
      expect.arrayContaining([
        { name: "ProviderRequestCount", unit: "Count", value: 1 },
        { name: "ProviderSuccessCount", unit: "Count", value: 1 },
        {
          name: "ProviderExchangeDurationMilliseconds",
          unit: "Milliseconds",
          value: expect.any(Number),
        },
        { name: "ProviderCostDollars", unit: "None", value: 0.0425 },
      ]),
    );
  });

  it("never logs the API key, presigned source URL or temporary result URL", async () => {
    const logs = vi.spyOn(logger, "log");
    await run(await successResponses());
    await run(() => new Response(null, { status: 500 }));
    const logged = JSON.stringify(logs.mock.calls);
    expect(logged).not.toMatch(/api-secret|source-secret|result-secret|X-Amz/);
    expect(logs).toHaveBeenCalledWith(
      "info",
      "provider_generation_charged",
      expect.objectContaining({
        cost: PAYLOAD.cost,
        provider: "leonardo",
        providerGenerationId: "generation-1",
        size: "auto",
      }),
    );
  });
});

describe("LeonardoProvider options", () => {
  it.each([
    { apiKey: " " },
    { maximumOutputBytes: 0 },
    { maximumPixels: 0 },
    { timeoutMilliseconds: 999 },
    { timeoutMilliseconds: 150_001 },
  ])("refuses invalid options %o", (override) => {
    expect(
      () =>
        new LeonardoProvider({ ...OPTIONS, ...override }, () =>
          Promise.resolve(SOURCE_URL),
        ),
    ).toThrow(RangeError);
  });
});
