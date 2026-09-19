import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import {
  INVENTORY_PREVIEW_RESPONSE_CONTENT_TYPE,
  INVENTORY_PREVIEW_RESPONSE_DISPOSITION,
} from "./inventory.constants";
import type { InventoryPreviewSignerPort } from "./inventory.types";

type PresignPreview = (
  client: S3Client,
  command: GetObjectCommand,
  options: { expiresIn: number },
) => Promise<string>;

export class S3InventoryPreviewSigner implements InventoryPreviewSignerPort {
  public constructor(
    private readonly client: S3Client,
    private readonly bucket: string,
    private readonly presign: PresignPreview = getSignedUrl,
  ) {}

  public signPreview(
    objectKey: string,
    expiresInSeconds: number,
  ): Promise<string> {
    return this.presign(
      this.client,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
        ResponseContentDisposition: INVENTORY_PREVIEW_RESPONSE_DISPOSITION,
        ResponseContentType: INVENTORY_PREVIEW_RESPONSE_CONTENT_TYPE,
      }),
      { expiresIn: expiresInSeconds },
    );
  }
}
