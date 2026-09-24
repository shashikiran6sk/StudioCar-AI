import { describe, expect, it } from "vitest";

import type { ProcessingFailureReason } from "../../../packages/contracts/src/jobs";
import { PROCESSING_FAILURE_CODES } from "../../../packages/processing/src/processing-worker.constants";
import { toProcessingFailureReason } from "../../../packages/processing/src/to-processing-failure-reason";

describe("toProcessingFailureReason", () => {
  it.each<[string | null, ProcessingFailureReason]>([
    [PROCESSING_FAILURE_CODES.INVALID_IMAGE, "UNUSABLE_IMAGE"],
    [PROCESSING_FAILURE_CODES.UNSUPPORTED_FORMAT, "UNUSABLE_IMAGE"],
    [PROCESSING_FAILURE_CODES.NON_CAR_IMAGE, "NON_CAR_IMAGE"],
    [PROCESSING_FAILURE_CODES.NETWORK, "SERVICE_UNAVAILABLE"],
    [PROCESSING_FAILURE_CODES.PROVIDER_429, "SERVICE_UNAVAILABLE"],
    [PROCESSING_FAILURE_CODES.PROVIDER_5XX, "SERVICE_UNAVAILABLE"],
    [PROCESSING_FAILURE_CODES.TIMEOUT, "SERVICE_UNAVAILABLE"],
    [PROCESSING_FAILURE_CODES.INVALID_REQUEST, "BACKGROUND_REMOVAL_FAILED"],
    [PROCESSING_FAILURE_CODES.AUTHORIZATION, "PROCESSING_FAILED"],
    [PROCESSING_FAILURE_CODES.INTERNAL, "PROCESSING_FAILED"],
    ["SOMETHING_NEW", "PROCESSING_FAILED"],
    [null, "PROCESSING_FAILED"],
  ])("maps a failed job with %s to %s", (errorCode, expected) => {
    expect(toProcessingFailureReason("FAILED", errorCode)).toBe(expected);
  });

  it("reports a cancelled job as cancelled whatever its last error", () => {
    expect(
      toProcessingFailureReason("CANCELLED", PROCESSING_FAILURE_CODES.TIMEOUT),
    ).toBe("CANCELLED");
  });
});
