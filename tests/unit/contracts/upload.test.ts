import { describe, expect, it } from "vitest";

import {
  CreateUploadIntentSchema,
  MAX_UPLOAD_BYTES,
} from "../../../packages/contracts/src/upload";

const vehicleId = "4f9d4891-157f-49ed-aa5a-c026abc0a768";

describe("upload contracts", () => {
  it("accepts supported images within the upload limit", () => {
    expect(
      CreateUploadIntentSchema.parse({
        vehicleId,
        filename: "front-angle.webp",
        mimeType: "image/webp",
        sizeBytes: MAX_UPLOAD_BYTES,
      }),
    ).toMatchObject({ filename: "front-angle.webp", mimeType: "image/webp" });
  });

  it("rejects traversal filenames, unsupported MIME types, and oversized images", () => {
    expect(
      CreateUploadIntentSchema.safeParse({
        vehicleId,
        filename: "../source.jpg",
        mimeType: "image/tiff",
        sizeBytes: MAX_UPLOAD_BYTES + 1,
      }).success,
    ).toBe(false);
  });
});
