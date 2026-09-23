import { describe, expect, it } from "vitest";

import type { JobState } from "../../../packages/contracts/src/jobs";
import { jobRequiresUserAttention } from "../../../packages/processing/src/job-requires-user-attention";

describe("jobRequiresUserAttention", () => {
  it.each<[JobState, boolean]>([
    ["CREATED", false],
    ["QUEUED", false],
    ["PROCESSING", false],
    ["RETRYING", false],
    ["COMPLETED", false],
    ["FAILED", true],
    ["CANCELLED", true],
  ])("treats %s as %s", (state, expected) => {
    expect(jobRequiresUserAttention(state)).toBe(expected);
  });
});
