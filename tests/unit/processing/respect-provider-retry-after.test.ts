import { expect, it } from "vitest";

import { respectProviderRetryAfter } from "../../../packages/processing/src/respect-provider-retry-after";

it("keeps the backoff without a provider hint", () => {
  expect(respectProviderRetryAfter(5_000, null, 300_000)).toBe(5_000);
});

it("keeps the backoff when the hint is shorter", () => {
  expect(respectProviderRetryAfter(5_000, 1_000, 300_000)).toBe(5_000);
});

it("waits for a longer hint, rounded up to whole milliseconds", () => {
  expect(respectProviderRetryAfter(5_000, 12_000.2, 300_000)).toBe(12_001);
});

it("caps a hint at the maximum but never below the backoff", () => {
  expect(respectProviderRetryAfter(5_000, 900_000, 300_000)).toBe(300_000);
  expect(respectProviderRetryAfter(310_000, 900_000, 300_000)).toBe(310_000);
});

it("ignores a hint that is not a finite number", () => {
  expect(respectProviderRetryAfter(5_000, Number.POSITIVE_INFINITY, 300_000)).toBe(5_000);
  expect(respectProviderRetryAfter(5_000, Number.NaN, 300_000)).toBe(5_000);
});
