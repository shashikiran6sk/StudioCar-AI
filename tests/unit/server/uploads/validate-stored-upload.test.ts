import { describe, expect, it } from "vitest";

import { hexSha256ToBase64 } from "../../../../apps/web/src/server/uploads/hex-sha256-to-base64";
import { validateStoredUpload } from "../../../../apps/web/src/server/uploads/validate-stored-upload";
import { createUploadTestAsset } from "./create-upload-test-asset";

function pngHeader(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(24);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 0x89504e47);
  view.setUint32(4, 0x0d0a1a0a);
  view.setUint32(12, 0x49484452);
  view.setUint32(16, width);
  view.setUint32(20, height);
  return bytes;
}

describe("validateStoredUpload", () => {
  it("requires matching S3 metadata, checksum, magic bytes, and dimensions", () => {
    const asset = createUploadTestAsset();
    const object = {
      contentLength: 24,
      contentType: "image/png",
      checksumSha256: hexSha256ToBase64("00".repeat(32)),
      etag: '"etag"',
      metadata: {
        "asset-id": asset.id,
        "user-id": asset.userId,
        "vehicle-id": asset.vehicleId,
      },
    };

    expect(
      validateStoredUpload(
        asset,
        object,
        pngHeader(1920, 1080),
        "image/png",
        '"etag"',
        16_384,
        100_000_000,
      ),
    ).toEqual({ valid: true, width: 1920, height: 1080 });
    expect(
      validateStoredUpload(
        asset,
        { ...object, contentLength: 25 },
        pngHeader(1920, 1080),
        "image/png",
        undefined,
        16_384,
        100_000_000,
      ),
    ).toMatchObject({ valid: false });
    expect(
      validateStoredUpload(
        asset,
        object,
        pngHeader(20_000, 20_000),
        "image/png",
        undefined,
        16_384,
        100_000_000,
      ),
    ).toMatchObject({ valid: false });
  });
});
