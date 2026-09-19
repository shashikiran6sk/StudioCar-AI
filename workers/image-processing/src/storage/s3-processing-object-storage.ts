import {
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

import {
  EMPTY_OBJECT_MESSAGE,
  OVERSIZED_OBJECT_MESSAGE,
} from "./s3-processing-object-storage.constants";
import { isMissingS3ObjectError } from "./is-missing-s3-object-error";
import { MissingProcessingObjectError } from "./missing-processing-object-error";
import type {
  ProcessingObjectStoragePort,
  ProcessingS3Client,
  PutProcessingObjectInput,
  StoredProcessingObject,
} from "./processing-object-storage.types";

export class S3ProcessingObjectStorage implements ProcessingObjectStoragePort {
  public constructor(
    private readonly client: ProcessingS3Client,
    private readonly bucket: string,
    private readonly maximumReadBytes: number,
  ) {}

  public async getOptional(key: string): Promise<StoredProcessingObject | null> {
    try {
      return await this.getRequired(key);
    } catch (error) {
      if (isMissingS3ObjectError(error)) return null;
      throw error;
    }
  }

  public async getRequired(key: string): Promise<StoredProcessingObject> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Range: `bytes=0-${String(this.maximumReadBytes)}`,
      }),
    );
    if (!response.Body) throw new MissingProcessingObjectError();
    const bytes = await response.Body.transformToByteArray();
    if (bytes.byteLength === 0) throw new Error(EMPTY_OBJECT_MESSAGE);
    if (bytes.byteLength > this.maximumReadBytes) {
      throw new Error(OVERSIZED_OBJECT_MESSAGE);
    }

    return {
      bytes,
      contentType: response.ContentType ?? null,
      metadata: response.Metadata ?? {},
    };
  }

  public async put(input: PutProcessingObjectInput): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Body: input.bytes,
        Bucket: this.bucket,
        ContentLength: input.bytes.byteLength,
        ContentType: input.contentType,
        Key: input.key,
        Metadata: input.metadata,
      }),
    );
  }
}
