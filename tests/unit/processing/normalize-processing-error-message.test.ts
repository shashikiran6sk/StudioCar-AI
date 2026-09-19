import { describe, expect, it } from "vitest";

import { normalizeProcessingErrorMessage } from "../../../packages/processing/src/normalize-processing-error-message";

describe("normalizeProcessingErrorMessage", () => {
  it("trims, bounds, and supplies a safe fallback", () => {
    expect(normalizeProcessingErrorMessage("  timed out  ")).toBe("timed out");
    expect(normalizeProcessingErrorMessage(" ")).toBe(
      "Image processing failed without a provider message.",
    );
    expect(normalizeProcessingErrorMessage("x".repeat(1_500))).toHaveLength(
      1_000,
    );
  });
});
