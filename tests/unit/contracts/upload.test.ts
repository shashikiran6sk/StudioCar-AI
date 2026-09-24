import { describe, expect, it } from "vitest";

import {
  CommitUploadPathSchema,
  CommitUploadResponseSchema,
  CreateUploadIntentSchema,
  CreateUploadIntentResponseSchema,
  MAX_UPLOAD_BYTES,
  UploadAssetPathSchema,
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
        checksumSha256: "a".repeat(64),
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
        checksumSha256: "invalid",
      }).success,
    ).toBe(false);
  });

  it("validates presign and committed-asset responses", () => {
    expect(
      CreateUploadIntentResponseSchema.safeParse({
        assetId: vehicleId,
        uploadUrl: "https://assets.example.test/signed-upload",
        method: "PUT",
        headers: { "content-type": "image/jpeg" },
        expiresAt: "2026-09-19T12:05:00.000Z",
      }).success,
    ).toBe(true);
    expect(
      CommitUploadResponseSchema.safeParse({
        assetId: vehicleId,
        status: "UPLOADED",
        mimeType: "image/jpeg",
        sizeBytes: 1024,
        width: 1920,
        height: 1080,
      }).success,
    ).toBe(true);
    expect(CommitUploadPathSchema.safeParse({ assetId: "unsafe" }).success).toBe(
      false,
    );
    expect(UploadAssetPathSchema.safeParse({ assetId: vehicleId }).success).toBe(
      true,
    );
  });
});
