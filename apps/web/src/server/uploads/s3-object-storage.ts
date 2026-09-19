import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { hexSha256ToBase64 } from "./hex-sha256-to-base64";
import {
  CHECKSUM_SHA256_HEADER,
  CONTENT_TYPE_HEADER,
} from "./upload.constants";
import type {
  CreatePresignedUploadCommand,
  PresignedUpload,
  StoredObjectMetadata,
  UploadObjectStoragePort,
} from "./upload.types";

type PresignUpload = (
  client: S3Client,
  command: PutObjectCommand,
  options: { expiresIn: number; unhoistableHeaders: Set<string> },
) => Promise<string>;

export class S3ObjectStorage implements UploadObjectStoragePort {
  public constructor(
    private readonly client: S3Client,
    private readonly bucket: string,
    private readonly presignUpload: PresignUpload = getSignedUrl,
  ) {}

  public async createPresignedUpload(
    command: CreatePresignedUploadCommand,
  ): Promise<PresignedUpload> {
    const encodedChecksum = hexSha256ToBase64(command.checksumSha256);
    const request = new PutObjectCommand({
      Bucket: this.bucket,
      Key: command.key,
      ContentLength: command.contentLength,
      ContentType: command.contentType,
      ChecksumSHA256: encodedChecksum,
      Metadata: command.metadata,
    });
    const metadataHeaders = Object.keys(command.metadata).map(
      (key) => `x-amz-meta-${key}`,
    );
    const url = await this.presignUpload(this.client, request, {
      expiresIn: command.expiresInSeconds,
      unhoistableHeaders: new Set([
        CONTENT_TYPE_HEADER,
        CHECKSUM_SHA256_HEADER,
        ...metadataHeaders,
      ]),
    });

    return {
      url,
      headers: {
        [CONTENT_TYPE_HEADER]: command.contentType,
        [CHECKSUM_SHA256_HEADER]: encodedChecksum,
        ...Object.fromEntries(
          Object.entries(command.metadata).map(([key, value]) => [
            `x-amz-meta-${key}`,
            value,
          ]),
        ),
      },
    };
  }

  public async headObject(key: string): Promise<StoredObjectMetadata | null> {
    try {
      const response = await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
          ChecksumMode: "ENABLED",
        }),
      );
      if (response.ContentLength === undefined) return null;

      return {
        contentLength: response.ContentLength,
        contentType: response.ContentType,
        checksumSha256: response.ChecksumSHA256,
        etag: response.ETag,
        metadata: response.Metadata ?? {},
      };
    } catch (error) {
      if (
        error instanceof S3ServiceException &&
        (error.name === "NotFound" || error.$metadata.httpStatusCode === 404)
      ) {
        return null;
      }
      throw error;
    }
  }

  public async readObjectPrefix(
    key: string,
    maximumBytes: number,
  ): Promise<Uint8Array> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Range: `bytes=0-${String(maximumBytes - 1)}`,
      }),
    );
    if (!response.Body) return new Uint8Array();
    return response.Body.transformToByteArray();
  }
}
