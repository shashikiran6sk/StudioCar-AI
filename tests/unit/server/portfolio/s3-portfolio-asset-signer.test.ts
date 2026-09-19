import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { describe, expect, it, vi } from "vitest";

import { S3PortfolioAssetSigner } from "../../../../apps/web/src/server/portfolio/s3-portfolio-asset-signer";

describe("S3PortfolioAssetSigner", () => {
  it("signs private inline and attachment responses with bounded expiry", async () => {
    const commands: GetObjectCommand[] = [];
    const presign = vi.fn(
      async (
        _client: S3Client,
        command: GetObjectCommand,
        _options: { expiresIn: number },
      ) => {
        commands.push(command);
        return "https://signed.example/asset";
      },
    );
    const signer = new S3PortfolioAssetSigner(
      new S3Client({ region: "ap-south-1" }),
      "private-studiocar-test",
      presign,
    );

    await signer.signInline("private/image.webp", "image/webp", 300);
    await signer.signDownload(
      "private/image.webp",
      "image/webp",
      "processed-01.webp",
      300,
    );

    expect(commands[0]?.input).toMatchObject({
      Bucket: "private-studiocar-test",
      Key: "private/image.webp",
      ResponseContentDisposition: "inline",
      ResponseContentType: "image/webp",
    });
    expect(commands[1]?.input.ResponseContentDisposition).toBe(
      'attachment; filename="processed-01.webp"',
    );
    expect(presign).toHaveBeenLastCalledWith(
      expect.any(S3Client),
      expect.any(GetObjectCommand),
      { expiresIn: 300 },
    );
  });
});
