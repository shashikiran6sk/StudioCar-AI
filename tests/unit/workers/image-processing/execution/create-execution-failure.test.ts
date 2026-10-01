import { expect, it } from "vitest";

import { createExecutionFailure } from "../../../../../workers/image-processing/src/execution/create-execution-failure";

it("creates a failure without provider attribution", () => {
  expect(createExecutionFailure("SOURCE", "INVALID_IMAGE", "bad")).toEqual({
    errorMessage: "bad",
    kind: "INVALID_IMAGE",
    providerLatencyMilliseconds: null,
    providerRequestId: null,
    retryAfterMilliseconds: null,
    stage: "SOURCE",
  });
});

it("attributes a later-stage failure to the provider exchange before it", () => {
  expect(
    createExecutionFailure("COMPOSITION", "INTERNAL", "failed", {
      providerLatencyMilliseconds: 900,
      providerRequestId: "generation-1",
    }),
  ).toMatchObject({ providerLatencyMilliseconds: 900, providerRequestId: "generation-1", stage: "COMPOSITION" });
});
