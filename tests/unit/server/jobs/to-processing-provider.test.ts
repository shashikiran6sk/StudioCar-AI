import { describe, expect, it } from "vitest";
import type { BackgroundRemovalProvider } from "../../../../packages/config/src/environment";

import { toProcessingProvider } from "../../../../apps/web/src/server/jobs/to-processing-provider";

describe("toProcessingProvider", () => {
  it.each([
    ["removebg", "REMOVEBG"],
    ["fal", "FAL"],
    ["birefnet", "BIREFNET"],
  ] satisfies readonly (readonly [BackgroundRemovalProvider, string])[])("maps %s without leaking provider selection into commands", (input, output) => {
    expect(toProcessingProvider(input)).toBe(output);
  });
});
