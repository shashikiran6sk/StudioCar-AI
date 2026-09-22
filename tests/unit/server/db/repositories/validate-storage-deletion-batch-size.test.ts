import { describe, expect, it } from "vitest";

import { validateStorageDeletionBatchSize } from "../../../../../apps/web/src/server/db/repositories/validate-storage-deletion-batch-size";

describe("validateStorageDeletionBatchSize", () => {
  it("accepts configured bounds and rejects unsafe batch sizes", () => {
    expect(() => validateStorageDeletionBatchSize(1)).not.toThrow();
    expect(() => validateStorageDeletionBatchSize(100)).not.toThrow();
    expect(() => validateStorageDeletionBatchSize(0)).toThrow(RangeError);
    expect(() => validateStorageDeletionBatchSize(101)).toThrow(RangeError);
    expect(() => validateStorageDeletionBatchSize(1.5)).toThrow(RangeError);
  });
});
