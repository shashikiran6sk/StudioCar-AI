import { describe, expect, it } from "vitest";

import { classifyProcessingFailure } from "../../../packages/processing/src/classify-processing-failure";
import type { ProcessingFailureKind } from "../../../packages/processing/src/processing-worker.types";

const retryableFailures: ProcessingFailureKind[] = [
  "NETWORK",
  "PROVIDER_429",
  "PROVIDER_5XX",
  "TIMEOUT",
];

const terminalFailures: ProcessingFailureKind[] = [
  "AUTHORIZATION",
  "INTERNAL",
  "INVALID_IMAGE",
  "INVALID_REQUEST",
  "UNSUPPORTED_FORMAT",
];

describe("classifyProcessingFailure", () => {
  it.each(retryableFailures)(
    "classifies %s as retryable",
    (kind) => {
      expect(classifyProcessingFailure(kind)).toMatchObject({
        retryable: true,
      });
    },
  );

  it.each(terminalFailures)("classifies %s as terminal", (kind) => {
    expect(classifyProcessingFailure(kind)).toMatchObject({ retryable: false });
  });
});
