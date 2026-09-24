import { DeleteObjectCommand, NoSuchKey, S3Client } from "@aws-sdk/client-s3";

import type { ObjectDeletionStoragePort } from "./storage-cleanup.types";

type SendDeleteObject = (command: DeleteObjectCommand) => Promise<unknown>;

export class S3ObjectDeletionStorage implements ObjectDeletionStoragePort {
  public constructor(
    client: S3Client,
    private readonly bucket: string,
    private readonly sendDeleteObject: SendDeleteObject = (command) =>
      client.send(command),
  ) {}

  public async deleteObject(objectKey: string): Promise<void> {
    try {
      await this.sendDeleteObject(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: objectKey }),
      );
    } catch (error) {
      if (error instanceof NoSuchKey) return;
      throw error;
    }
  }
}
