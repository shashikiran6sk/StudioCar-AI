import { expect, it } from "vitest";

import { classifyProviderStatus } from "../../../../../workers/image-processing/src/providers/classify-provider-status";

it.each([
  [401, "AUTHORIZATION"],
  [403, "AUTHORIZATION"],
  [402, "PAYMENT_REQUIRED"],
  [408, "TIMEOUT"],
  [429, "RATE_LIMITED"],
  [500, "SERVER_ERROR"],
  [502, "SERVER_ERROR"],
  [504, "SERVER_ERROR"],
  [400, "REJECTED"],
  [404, "REJECTED"],
  [422, "REJECTED"],
])("classifies HTTP %i as %s", (status, category) => {
  expect(classifyProviderStatus(status)).toBe(category);
});
