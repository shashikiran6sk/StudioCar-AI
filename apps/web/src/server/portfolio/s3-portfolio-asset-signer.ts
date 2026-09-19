import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { PORTFOLIO_INLINE_DISPOSITION } from "./portfolio.constants";
import type { PortfolioAssetSignerPort } from "./portfolio.types";

type PresignAsset = (
  client: S3Client,
  command: GetObjectCommand,
  options: { expiresIn: number },
) => Promise<string>;

export class S3PortfolioAssetSigner implements PortfolioAssetSignerPort {
  public constructor(
    private readonly client: S3Client,
    private readonly bucket: string,
    private readonly presign: PresignAsset = getSignedUrl,
  ) {}

  public signInline(
    objectKey: string,
    mimeType: string,
    expiresInSeconds: number,
  ): Promise<string> {
    return this.sign(
      objectKey,
      mimeType,
      PORTFOLIO_INLINE_DISPOSITION,
      expiresInSeconds,
    );
  }

  public signDownload(
    objectKey: string,
    mimeType: string,
    filename: string,
    expiresInSeconds: number,
  ): Promise<string> {
    const disposition = `attachment; filename="${encodeURIComponent(filename)}"`;
    return this.sign(objectKey, mimeType, disposition, expiresInSeconds);
  }

  private sign(
    objectKey: string,
    mimeType: string,
    disposition: string,
    expiresInSeconds: number,
  ): Promise<string> {
    return this.presign(
      this.client,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
        ResponseContentDisposition: disposition,
        ResponseContentType: mimeType,
      }),
      { expiresIn: expiresInSeconds },
    );
  }
}
