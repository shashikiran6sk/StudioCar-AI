import { S3Client } from "@aws-sdk/client-s3";
import { describe, expect, it, vi } from "vitest";

import { S3ObjectStorage } from "../../../../apps/web/src/server/uploads/s3-object-storage";

describe("S3ObjectStorage", () => {
  it("signs a private PUT with immutable metadata and checksum headers", async () => {
    const client = new S3Client({
      region: "ap-south-1",
      credentials: { accessKeyId: "test", secretAccessKey: "test" },
    });
    const presign = vi.fn(
      async (_client, command, options) => {
        expect(command.input).toMatchObject({
          Bucket: "private-assets",
          Key: "users/user-1/assets/asset-1/source.png",
          ContentLength: 24,
          ContentType: "image/png",
          ChecksumSHA256: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
          Metadata: { "asset-id": "asset-1" },
        });
        expect(options.expiresIn).toBe(300);
        expect(options.unhoistableHeaders).toEqual(
          new Set([
            "content-type",
            "x-amz-checksum-sha256",
            "x-amz-meta-asset-id",
          ]),
        );
        return "https://assets.example.test/signed-upload";
      },
    );
    const storage = new S3ObjectStorage(client, "private-assets", presign);

    await expect(
      storage.createPresignedUpload({
        key: "users/user-1/assets/asset-1/source.png",
        contentType: "image/png",
        contentLength: 24,
        checksumSha256: "00".repeat(32),
        expiresInSeconds: 300,
        metadata: { "asset-id": "asset-1" },
      }),
    ).resolves.toEqual({
      url: "https://assets.example.test/signed-upload",
      headers: {
        "content-type": "image/png",
        "x-amz-checksum-sha256":
          "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        "x-amz-meta-asset-id": "asset-1",
      },
    });

    client.destroy();
  });
});
