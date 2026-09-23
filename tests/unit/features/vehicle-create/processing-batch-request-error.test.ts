import { describe, expect, it } from "vitest";

import { ProcessingBatchRequestError } from "../../../../apps/web/src/features/vehicle-create/processing-batch-request-error";

describe("ProcessingBatchRequestError", () => {
  it("is an Error that carries the endpoint's user-facing message", () => {
    const error = new ProcessingBatchRequestError("Your plan allows up to 5 images.");

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("ProcessingBatchRequestError");
    expect(error.message).toBe("Your plan allows up to 5 images.");
  });
});
