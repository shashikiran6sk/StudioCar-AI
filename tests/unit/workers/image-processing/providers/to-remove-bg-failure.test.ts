import { describe, expect, it } from "vitest";

import { toRemoveBgFailure } from "../../../../../workers/image-processing/src/providers/to-remove-bg-failure";

describe("toRemoveBgFailure", () => {
  it.each([
    { status: 429, kind: "PROVIDER_429" },
    { status: 503, kind: "PROVIDER_5XX" },
    { status: 401, kind: "AUTHORIZATION" },
    { status: 402, kind: "AUTHORIZATION" },
    { status: 403, kind: "AUTHORIZATION" },
    { status: 400, kind: "INVALID_REQUEST" },
  ])("maps HTTP $status to $kind", ({ status, kind }) => {
    expect(toRemoveBgFailure(status, 120, "request-1")).toMatchObject({
      kind,
      providerLatencyMilliseconds: 120,
      providerRequestId: "request-1",
    });
  });
});
