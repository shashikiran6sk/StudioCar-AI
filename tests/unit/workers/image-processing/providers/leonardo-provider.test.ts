import sharp from "sharp";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LeonardoProvider } from "../../../../../workers/image-processing/src/providers/leonardo-provider";
import { logger } from "../../../../../packages/observability/src/structured-logger";
import type { ProcessImageInput } from "../../../../../packages/processing/src/background-removal-provider.types";

const INPUT: ProcessImageInput = {
  bytes: new Uint8Array(),
  contentType: "image/jpeg",
  idempotencyKey: "job-1",
  shadow: "NATURAL",
  sourceObjectKey: "users/owner/source.jpg",
  context: { assetId: "asset-1", vehicleId: "vehicle-1", attempt: 2 },
};
const SOURCE_URL = "https://source.example/car.jpg?signature=source-secret";
const RESULT_URL = "https://result.example/cutout.webp?signature=result-secret";
const OPTIONS = {
  apiKey: "api-secret",
  maximumOutputBytes: 1024 * 1024,
  maximumPixels: 1_000_000,
  timeoutMilliseconds: 500,
};
const PAYLOAD = {
  id: "generation-1",
  cost: { amount: "0.1047", unit: "DOLLARS" },
  results: [
    { url: RESULT_URL, contentType: "image/webp", width: 30, height: 20 },
  ],
};

async function imageBytes() {
  return sharp({
    create: {
      width: 30,
      height: 20,
      channels: 4,
      background: { r: 10, g: 20, b: 30, alpha: 0.5 },
    },
  })
    .webp()
    .toBuffer();
}

describe("LeonardoProvider", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("uses URL JSON and Bearer auth, downloads without credentials, and logs actual cost and dimensions", async () => {
    const logs = vi.spyOn(logger, "log");
    const bytes = await imageBytes();
    const calls: { url: string; init: RequestInit | undefined }[] = [];
    const fetcher: typeof fetch = (url, init) => {
      calls.push({ url: String(url), init });
      return Promise.resolve(
        calls.length === 1
          ? Response.json(PAYLOAD)
          : new Response(bytes, { headers: { "content-type": "image/webp" } }),
      );
    };
    const resolver = vi.fn(() => Promise.resolve(SOURCE_URL));
    const result = await new LeonardoProvider(
      OPTIONS,
      resolver,
      fetcher,
    ).process(INPUT);
    expect(resolver).toHaveBeenCalledWith(INPUT.sourceObjectKey);
    expect(result).toMatchObject({
      ok: true,
      result: {
        bytes: Uint8Array.from(bytes),
        contentType: "image/webp",
        providerRequestId: "generation-1",
      },
    });
    expect(calls[0]?.url).toBe(
      "https://cloud.leonardo.ai/api/rest/v2/generationssync",
    );
    expect(new Headers(calls[0]?.init?.headers).get("Authorization")).toBe(
      "Bearer api-secret",
    );
    expect(new Headers(calls[0]?.init?.headers).get("Accept")).toBe(
      "application/json",
    );
    expect(new Headers(calls[0]?.init?.headers).get("Content-Type")).toBe(
      "application/json",
    );
    const body = calls[0]?.init?.body;
    expect(typeof body).toBe("string");
    if (typeof body !== "string") throw new Error("Expected JSON body");
    const request: unknown = JSON.parse(body);
    expect(request).toEqual({
      model: "remove-bg",
      public: false,
      ephemeral: true,
      parameters: {
        size: "full",
        type: "car",
        format: "webp",
        channels: "rgba",
        semitransparency: true,
        shadow_type: "none",
        guidances: {
          image_reference: [{ image: { type: "URL", url: SOURCE_URL } }],
        },
      },
    });
    expect(calls[1]?.url).toBe(RESULT_URL);
    expect(calls[1]?.init?.headers).toBeUndefined();
    expect(logs).toHaveBeenCalledWith(
      "info",
      "leonardo_generated",
      expect.objectContaining({
        provider: "leonardo",
        providerGenerationId: "generation-1",
        jobId: "job-1",
        assetId: "asset-1",
        vehicleId: "vehicle-1",
        attempt: 2,
        size: "full",
        format: "webp",
        width: 30,
        height: 20,
        cost: PAYLOAD.cost,
      }),
    );
    expect(JSON.stringify(logs.mock.calls)).not.toMatch(
      /api-secret|source-secret|result-secret/,
    );
  });

  it.each([
    [401, "AUTHORIZATION"],
    [403, "AUTHORIZATION"],
    [400, "INVALID_REQUEST"],
    [422, "INVALID_REQUEST"],
    [429, "PROVIDER_429"],
    [500, "PROVIDER_5XX"],
    [503, "PROVIDER_5XX"],
    [402, "PAYMENT_REQUIRED"],
  ])("maps HTTP %s without internal retries", async (status, kind) => {
    const fetcher = vi.fn<typeof fetch>(() =>
      Promise.resolve(new Response("private-error", { status })),
    );
    const result = await new LeonardoProvider(
      OPTIONS,
      () => Promise.resolve(SOURCE_URL),
      fetcher,
    ).process(INPUT);
    expect(result).toMatchObject({ ok: false, failure: { kind } });
    expect(JSON.stringify(result)).not.toContain("private-error");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it.each([
    { ...PAYLOAD, results: [] },
    { id: "generation-1" },
    { ...PAYLOAD, results: [{ contentType: "image/webp" }] },
    {
      ...PAYLOAD,
      results: [{ url: "http://unsafe.example/a", contentType: "image/webp" }],
    },
    { ...PAYLOAD, results: [{ url: RESULT_URL, contentType: "image/jpeg" }] },
  ])("rejects invalid JSON contracts permanently", async (payload) => {
    const fetcher = vi.fn<typeof fetch>(() =>
      Promise.resolve(Response.json(payload)),
    );
    await expect(
      new LeonardoProvider(
        OPTIONS,
        () => Promise.resolve(SOURCE_URL),
        fetcher,
      ).process(INPUT),
    ).resolves.toMatchObject({
      ok: false,
      failure: { kind: "INVALID_REQUEST" },
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("rejects malformed JSON permanently", async () => {
    await expect(
      new LeonardoProvider(
        OPTIONS,
        () => Promise.resolve(SOURCE_URL),
        () => Promise.resolve(new Response("not-json")),
      ).process(INPUT),
    ).resolves.toMatchObject({
      ok: false,
      failure: { kind: "INVALID_REQUEST" },
    });
  });
  it("rejects missing source keys and invalid signed URLs before charging", async () => {
    const fetcher = vi.fn<typeof fetch>();
    await expect(
      new LeonardoProvider(
        OPTIONS,
        () => Promise.resolve("http://localhost/car.jpg"),
        fetcher,
      ).process(INPUT),
    ).resolves.toMatchObject({
      ok: false,
      failure: { kind: "INVALID_REQUEST" },
    });
    await expect(
      new LeonardoProvider(
        OPTIONS,
        () => Promise.resolve(SOURCE_URL),
        fetcher,
      ).process({
        bytes: INPUT.bytes,
        contentType: INPUT.contentType,
        idempotencyKey: INPUT.idempotencyKey,
        shadow: INPUT.shadow,
      }),
    ).resolves.toMatchObject({ ok: false });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("bounds the entire request and download with one timeout", async () => {
    vi.useFakeTimers();
    const fetcher: typeof fetch = (_url, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener(
          "abort",
          () => reject(new Error("secret-url")),
          { once: true },
        );
      });
    const result = new LeonardoProvider(
      OPTIONS,
      () => Promise.resolve(SOURCE_URL),
      fetcher,
    ).process(INPUT);
    await vi.advanceTimersByTimeAsync(500);
    await expect(result).resolves.toMatchObject({
      ok: false,
      failure: { kind: "TIMEOUT" },
    });
  });
  it("classifies a failed network exchange as transient", async () => {
    await expect(
      new LeonardoProvider(
        OPTIONS,
        () => Promise.resolve(SOURCE_URL),
        () => Promise.reject(new Error("private-network-detail")),
      ).process(INPUT),
    ).resolves.toMatchObject({ ok: false, failure: { kind: "NETWORK" } });
  });

  it.each(["http", "network", "invalid", "mime", "oversized", "dimensions"])(
    "handles %s download failure without leaking temporary URLs",
    async (mode) => {
      let calls = 0;
      const bytes = await imageBytes();
      const fetcher: typeof fetch = () => {
        calls++;
        if (calls === 1)
          return Promise.resolve(
            Response.json(
              mode === "dimensions"
                ? {
                    ...PAYLOAD,
                    results: [{ ...PAYLOAD.results[0], width: 31 }],
                  }
                : PAYLOAD,
            ),
          );
        if (mode === "network") return Promise.reject(new Error(RESULT_URL));
        return Promise.resolve(
          new Response(mode === "invalid" ? new Uint8Array([1, 2, 3]) : bytes, {
            status: mode === "http" ? 403 : 200,
            headers: {
              "content-type": mode === "mime" ? "text/html" : "image/webp",
              ...(mode === "oversized"
                ? { "content-length": "999999999" }
                : {}),
            },
          }),
        );
      };
      const result = await new LeonardoProvider(
        OPTIONS,
        () => Promise.resolve(SOURCE_URL),
        fetcher,
      ).process(INPUT);
      expect(result).toMatchObject({
        ok: false,
        failure: {
          kind:
            mode === "http" || mode === "network" ? "NETWORK" : "INVALID_IMAGE",
          providerRequestId: "generation-1",
        },
      });
      expect(JSON.stringify(result)).not.toContain("result-secret");
      expect(calls).toBe(2);
    },
  );
});
