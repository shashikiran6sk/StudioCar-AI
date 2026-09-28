import { afterEach, describe, expect, it, vi } from "vitest";

import { RemoveBgProvider } from "../../../../../workers/image-processing/src/providers/remove-bg-provider";

import type { OperationalEvent } from "../../../../../packages/observability/src/operational-telemetry.types";
import { monitoringContext } from "../../../../../packages/observability/src/monitoring-context";

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
  afterEach(() => {
    vi.useRealTimers();
  });

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

  it("returns a permanent non-car failure for an unknown foreground", async () => {
    const provider = new RemoveBgProvider(
      {
        apiKey: "secret-provider-key",
        maximumOutputBytes: 1_024,
        timeoutMilliseconds: 5_000,
      },
      () =>
        Promise.resolve(
          Response.json(
            {
              errors: [
                {
                  code: "unknown_foreground",
                  title: "Could not identify foreground in image.",
                },
              ],
            },
            {
              status: 400,
              headers: { "x-request-id": "remove-bg-non-car" },
            },
          ),
        ),
      createClock(2_100, 2_140),
    );

    await expect(provider.process(INPUT)).resolves.toEqual({
      ok: false,
      failure: {
        errorMessage:
          "The background-removal provider could not detect a car in the image.",
        kind: "NON_CAR_IMAGE",
        providerLatencyMilliseconds: 40,
        providerRequestId: "remove-bg-non-car",
      },
    });
  });

  it("keeps other remove.bg validation rejections generic", async () => {
    const provider = new RemoveBgProvider(
      {
        apiKey: "secret-provider-key",
        maximumOutputBytes: 1_024,
        timeoutMilliseconds: 5_000,
      },
      () =>
        Promise.resolve(
          Response.json(
            {
              errors: [
                {
                  code: "invalid_format",
                  title: "provider-internal-detail",
                },
              ],
            },
            { status: 400 },
          ),
        ),
      createClock(2_200, 2_230),
    );

    await expect(provider.process(INPUT)).resolves.toEqual({
      ok: false,
      failure: {
        errorMessage:
          "The background-removal provider rejected the image request.",
        kind: "INVALID_REQUEST",
        providerLatencyMilliseconds: 30,
        providerRequestId: null,
      },
    });
  });

  it("normalizes provider 5xx responses as retryable failures", async () => {
    const provider = new RemoveBgProvider(
      {
        apiKey: "secret-provider-key",
        maximumOutputBytes: 1_024,
        timeoutMilliseconds: 5_000,
      },
      () => Promise.resolve(new Response(null, { status: 500 })),
      createClock(2_300, 2_350),
    );

    await expect(provider.process(INPUT)).resolves.toMatchObject({
      ok: false,
      failure: {
        kind: "PROVIDER_5XX",
        providerLatencyMilliseconds: 50,
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

  it("normalizes provider timeouts", async () => {
    vi.useFakeTimers();
    const provider = new RemoveBgProvider(
      {
        apiKey: "secret-provider-key",
        maximumOutputBytes: 1_024,
        timeoutMilliseconds: 500,
      },
      (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener(
            "abort",
            () => {
              reject(new Error("provider timeout detail"));
            },
            { once: true },
          );
        }),
      createClock(3_100, 3_600),
    );

    const processing = provider.process(INPUT);
    await vi.advanceTimersByTimeAsync(500);

    await expect(processing).resolves.toMatchObject({
      ok: false,
      failure: {
        errorMessage: "The background-removal provider timed out.",
        kind: "TIMEOUT",
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

it("correlates provider exchanges and records fractional charges without guessing credits", async () => {
  const events: OperationalEvent[] = [];
  const provider = new RemoveBgProvider(
    {
      apiKey: "secret-provider-key",
      maximumOutputBytes: 1024,
      timeoutMilliseconds: 5000,
    },
    () =>
      Promise.resolve(
        new Response(Uint8Array.from([1]), {
          headers: {
            "content-type": "image/webp",
            "x-credits-charged": "0.25",
          },
        }),
      ),
    Date.now,
    {
      emit: (event) => {
        events.push(event);
        return true;
      },
    },
  );
  const result = await monitoringContext.run(
    { requestId: "request-1", batchId: "batch-1", jobId: "job-1" },
    () => provider.process(INPUT),
  );
  expect(result.ok).toBe(true);
  expect(events).toHaveLength(2);
  expect(events[0]?.correlation).toMatchObject({
    requestId: "request-1",
    batchId: "batch-1",
    jobId: "job-1",
  });
  expect(events[0]?.metrics).toContainEqual(
    expect.objectContaining({ name: "removebg.request.count", value: 1 }),
  );
  expect(events[1]?.metrics).toContainEqual(
    expect.objectContaining({ name: "removebg.success.count", value: 1 }),
  );
  expect(events[1]?.metrics).toContainEqual(
    expect.objectContaining({ name: "removebg.credits.charged", value: 0.25 }),
  );
  expect(JSON.stringify(events)).not.toContain("secret-provider-key");
});
it("preserves processing outcomes when the telemetry sink throws", async () => {
  const provider = new RemoveBgProvider(
    {
      apiKey: "secret-provider-key",
      maximumOutputBytes: 1024,
      timeoutMilliseconds: 5000,
    },
    () => Promise.resolve(new Response("rate-limit-details", { status: 429 })),
    Date.now,
    {
      emit: () => {
        throw new Error("Telemetry unavailable");
      },
    },
  );
  await expect(provider.process(INPUT)).resolves.toMatchObject({
    ok: false,
    failure: { kind: "PROVIDER_429" },
  });
});
