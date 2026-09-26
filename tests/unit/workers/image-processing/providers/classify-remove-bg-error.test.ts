import { expect, it } from "vitest";
import { classifyRemoveBgError } from "../../../../../workers/image-processing/src/providers/classify-remove-bg-error";
it.each([
  [401, "REMOVE_BG_UNAUTHORIZED"],
  [403, "REMOVE_BG_UNAUTHORIZED"],
  [402, "REMOVE_BG_PAYMENT_REQUIRED"],
  [429, "REMOVE_BG_RATE_LIMIT"],
  [500, "REMOVE_BG_SERVER_ERROR"],
  [503, "REMOVE_BG_SERVER_ERROR"],
  [400, "REMOVE_BG_FAILED"],
  [undefined, "REMOVE_BG_FAILED"],
])("classifies %s safely", (status, code) => {
  expect(
    classifyRemoveBgError(typeof status === "number" ? status : undefined),
  ).toBe(code);
});
