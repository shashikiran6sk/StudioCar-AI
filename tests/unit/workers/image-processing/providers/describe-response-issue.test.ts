import { expect, it } from "vitest";

import { LeonardoResponseSchema } from "../../../../../packages/contracts/src/leonardo";
import { describeResponseIssue } from "../../../../../workers/image-processing/src/providers/describe-response-issue";

function issueOf(value: unknown) {
  const parsed = LeonardoResponseSchema.safeParse(value);
  if (parsed.success) throw new Error("Expected a validation failure.");
  return describeResponseIssue(parsed.error);
}

it("names the first failing field path and issue code, never the value", () => {
  expect(issueOf({ results: [424242] })).toEqual({
    responseIssueCode: "invalid_type",
    responseIssuePath: "results.0",
  });
  expect(JSON.stringify(issueOf({ results: [424242] }))).not.toContain("424242");
});

it("names the body itself as the root", () => {
  expect(issueOf("text")).toEqual({
    responseIssueCode: "invalid_type",
    responseIssuePath: "root",
  });
});

it("describes an error without issues generically", () => {
  expect(describeResponseIssue({ issues: [] })).toEqual({
    responseIssueCode: "invalid",
    responseIssuePath: "root",
  });
});
