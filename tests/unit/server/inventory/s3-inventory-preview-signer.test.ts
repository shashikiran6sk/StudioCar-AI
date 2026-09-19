import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { describe, expect, it, vi } from "vitest";

import { S3InventoryPreviewSigner } from "../../../../apps/web/src/server/inventory/s3-inventory-preview-signer";

describe("S3InventoryPreviewSigner", () => {
  it("creates a short-lived inline private-object request", async () => {
    let capturedCommand: GetObjectCommand | undefined;
    const presign = vi.fn(
      async (
        _client: S3Client,
        command: GetObjectCommand,
        _options: { expiresIn: number },
      ) => {
        capturedCommand = command;
        return "https://signed.example/preview.webp";
      },
    );
    const signer = new S3InventoryPreviewSigner(
      new S3Client({ region: "ap-south-1" }),
      "private-studiocar-test",
      presign,
    );

    await expect(signer.signPreview("private/preview.webp", 300)).resolves.toBe(
      "https://signed.example/preview.webp",
    );
    expect(presign).toHaveBeenCalledWith(
      expect.any(S3Client),
      expect.any(GetObjectCommand),
      { expiresIn: 300 },
    );
    if (!capturedCommand) throw new Error("Expected the signing command.");
    expect(capturedCommand.input).toMatchObject({
      Bucket: "private-studiocar-test",
      Key: "private/preview.webp",
      ResponseContentDisposition: "inline",
      ResponseContentType: "image/webp",
    });
  });
});
