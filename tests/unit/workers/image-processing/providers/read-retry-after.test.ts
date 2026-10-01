import { expect, it } from "vitest";

import { readRetryAfter } from "../../../../../workers/image-processing/src/providers/read-retry-after";

const NOW = Date.parse("2026-09-30T12:00:00.000Z");

function headers(value?: string): Headers {
  return new Headers(value === undefined ? {} : { "retry-after": value });
}

it("reads delay-seconds", () => {
  expect(readRetryAfter(headers("30"), "retry-after", NOW)).toBe(30_000);
  expect(readRetryAfter(headers(" 0 "), "retry-after", NOW)).toBe(0);
});

it("reads an HTTP date in the future", () => {
  expect(
    readRetryAfter(headers("Wed, 30 Sep 2026 12:00:45 GMT"), "retry-after", NOW),
  ).toBe(45_000);
});

it.each([undefined, "", "soon", "-5", "1.5", "Wed, 30 Sep 2026 11:59:00 GMT"])(
  "gives no hint for %j",
  (value) => {
    expect(readRetryAfter(headers(value), "retry-after", NOW)).toBeNull();
  },
);
