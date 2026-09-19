import { describe, expect, it } from "vitest";

import { RemoveBgProvider } from "../../../../../workers/image-processing/src/providers/remove-bg-provider";

const INPUT = {
  bytes: Uint8Array.from([1, 2, 3]),
  contentType: "image/jpeg",
  idempotencyKey: "processing-job-1",
  shadow: "NATURAL",
} satisfies Parameters<RemoveBgProvider["process"]>[0];

function createClock(...values: number[]): () => number {
  return () => {
    const value = values.shift();
    if (value === undefined) throw new Error("Test clock was exhausted.");
    return value;
  };
}

describe("RemoveBgProvider", () => {
  it("sends a private multipart request and normalizes a WebP response", async () => {
    let capturedApiKey: string | null = null;
    let capturedSize: unknown;
    let capturedType: unknown;
    let capturedFormat: unknown;
    let capturedShadow: unknown;
    let capturedTag: unknown;
    const fetcher: typeof fetch = (_input, init) => {
      capturedApiKey = new Headers(init?.headers).get("x-api-key");
      if (init?.body instanceof FormData) {
        capturedSize = init.body.get("size");
        capturedType = init.body.get("type");
        capturedFormat = init.body.get("format");
        capturedShadow = init.body.get("shadow_type");
        capturedTag = init.body.get("tag");
      }
      return Promise.resolve(
        new Response(Uint8Array.from([8, 9]), {
          status: 200,
          headers: {
            "content-type": "image/webp",
            "x-request-id": "remove-bg-request-1",
          },
        }),
      );
    };
    const provider = new RemoveBgProvider(
      {
        apiKey: "secret-provider-key",
        maximumOutputBytes: 1_024,
        timeoutMilliseconds: 5_000,
      },
      fetcher,
      createClock(1_000, 1_250),
    );

    await expect(provider.process(INPUT)).resolves.toEqual({
      ok: true,
      result: {
        bytes: Uint8Array.from([8, 9]),
        contentType: "image/webp",
        providerLatencyMilliseconds: 250,
        providerRequestId: "remove-bg-request-1",
      },
    });
    expect(capturedApiKey).toBe("secret-provider-key");
    expect(capturedSize).toBe("auto");
    expect(capturedType).toBe("car");
    expect(capturedFormat).toBe("webp");
    expect(capturedShadow).toBe("car");
    expect(capturedTag).toBe("processing-job-1");
  });

  it("normalizes rate limits without exposing provider response bodies", async () => {
    const provider = new RemoveBgProvider(
      {
        apiKey: "secret-provider-key",
        maximumOutputBytes: 1_024,
        timeoutMilliseconds: 5_000,
      },
      () =>
        Promise.resolve(
          new Response("provider-internal-detail", { status: 429 }),
        ),
      createClock(2_000, 2_050),
    );

    await expect(provider.process(INPUT)).resolves.toEqual({
      ok: false,
      failure: {
        errorMessage:
          "The background-removal provider rate limited the request.",
        kind: "PROVIDER_429",
        providerLatencyMilliseconds: 50,
        providerRequestId: null,
      },
    });
  });

  it("normalizes network failures", async () => {
    const provider = new RemoveBgProvider(
      {
        apiKey: "secret-provider-key",
        maximumOutputBytes: 1_024,
        timeoutMilliseconds: 5_000,
      },
      () => Promise.reject(new Error("socket detail")),
      createClock(3_000, 3_010),
    );

    await expect(provider.process(INPUT)).resolves.toMatchObject({
      ok: false,
      failure: {
        errorMessage: "The background-removal provider could not be reached.",
        kind: "NETWORK",
      },
    });
  });

  it("rejects invalid successful responses as retryable provider failures", async () => {
    const provider = new RemoveBgProvider(
      {
        apiKey: "secret-provider-key",
        maximumOutputBytes: 1,
        timeoutMilliseconds: 5_000,
      },
      () =>
        Promise.resolve(
          new Response(Uint8Array.from([1, 2]), {
            status: 200,
            headers: { "content-type": "image/webp" },
          }),
        ),
      createClock(4_000, 4_010),
    );

    await expect(provider.process(INPUT)).resolves.toMatchObject({
      ok: false,
      failure: {
        errorMessage:
          "The background-removal provider returned an invalid image response.",
        kind: "PROVIDER_5XX",
      },
    });
  });
});
