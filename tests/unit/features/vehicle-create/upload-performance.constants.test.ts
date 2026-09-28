import { expect, it } from "vitest";
import { PHOTO_UPLOAD_CONCURRENCY } from "../../../../apps/web/src/features/vehicle-create/upload-performance.constants";
it("keeps simultaneous full-file reads bounded for twenty-photo batches", () => {
  expect(PHOTO_UPLOAD_CONCURRENCY).toBeGreaterThanOrEqual(3);
  expect(PHOTO_UPLOAD_CONCURRENCY).toBeLessThanOrEqual(4);
});
