import { expect, it } from "vitest";

import { downloadProviderResult } from "../../../../../workers/image-processing/src/providers/download-provider-result";

const URL = "https://cdn.example/result.webp?token=secret";

function harness(responses: (() => Response)[]) {
  const pauses: number[] = [];
  const inits: (RequestInit | undefined)[] = [];
  const fetcher: typeof fetch = (_url, init) => {
    inits.push(init);
    const next = responses[inits.length - 1];
    if (!next) throw new Error("Unexpected fetch.");
    return Promise.resolve().then(next);
  };
  const sleep = (milliseconds: number) => {
    pauses.push(milliseconds);
    return Promise.resolve();
  };
  return { fetcher, inits, pauses, sleep };
}

it("returns the first response that is not transient", async () => {
  const { fetcher, inits, pauses, sleep } = harness([
    () => new Response("ok", { status: 200 }),
  ]);
  const response = await downloadProviderResult(URL, fetcher, new AbortController().signal, sleep);
  expect(response.status).toBe(200);
  expect(inits).toHaveLength(1);
  expect(inits[0]).toMatchObject({ redirect: "error" });
  expect(pauses).toEqual([]);
});

it.each([404, 403, 400])("returns a %i at once for the caller to classify", async (status) => {
  const { fetcher, inits, sleep } = harness([() => new Response(null, { status })]);
  const response = await downloadProviderResult(URL, fetcher, new AbortController().signal, sleep);
  expect(response.status).toBe(status);
  expect(inits).toHaveLength(1);
});

it("retries network errors and transient statuses twice, pausing between", async () => {
  const { fetcher, inits, pauses, sleep } = harness([
    () => {
      throw new TypeError("fetch failed");
    },
    () => new Response(null, { status: 503 }),
    () => new Response("ok", { status: 200 }),
  ]);
  const response = await downloadProviderResult(URL, fetcher, new AbortController().signal, sleep);
  expect(response.status).toBe(200);
  expect(inits).toHaveLength(3);
  expect(pauses).toEqual([1_000, 2_000]);
});

it("returns the last transient response after three attempts", async () => {
  const { fetcher, inits, sleep } = harness([
    () => new Response(null, { status: 429 }),
    () => new Response(null, { status: 408 }),
    () => new Response(null, { status: 502 }),
  ]);
  const response = await downloadProviderResult(URL, fetcher, new AbortController().signal, sleep);
  expect(response.status).toBe(502);
  expect(inits).toHaveLength(3);
});

it("stops as soon as the exchange deadline aborts", async () => {
  const controller = new AbortController();
  const { fetcher, inits } = harness([() => new Response(null, { status: 503 })]);
  await expect(
    downloadProviderResult(URL, fetcher, controller.signal, () => {
      controller.abort();
      return Promise.resolve();
    }),
  ).rejects.toThrow();
  expect(inits).toHaveLength(1);
});
