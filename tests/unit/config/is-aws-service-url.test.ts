import { describe, expect, it } from "vitest";

import { isAwsServiceUrl } from "../../../packages/config/src/is-aws-service-url";

describe("isAwsServiceUrl", () => {
  it.each([
    ["https://s3.ap-south-1.amazonaws.com", true],
    ["https://sqs.ap-south-1.amazonaws.com/123456789012/queue", true],
    ["http://s3.ap-south-1.amazonaws.com", false],
    ["https://amazonaws.com.attacker.example", false],
    ["http://localhost:9000", false],
    ["not a url", false],
  ])("%s is an AWS service address: %s", (value, expected) => {
    expect(isAwsServiceUrl(value)).toBe(expected);
  });
});
