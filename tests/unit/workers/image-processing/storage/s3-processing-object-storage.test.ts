import {
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
  type GetObjectCommandOutput,
  type PutObjectCommandInput,
  type PutObjectCommandOutput,
} from "@aws-sdk/client-s3";
import { describe, expect, it } from "vitest";

import type { ProcessingS3Client } from "../../../../../workers/image-processing/src/storage/processing-object-storage.types";
import { S3ProcessingObjectStorage } from "../../../../../workers/image-processing/src/storage/s3-processing-object-storage";

class MissingReadS3Client implements ProcessingS3Client {
  public readonly putInputs: PutObjectCommandInput[] = [];

  public send(command: GetObjectCommand): Promise<GetObjectCommandOutput>;
  public send(command: PutObjectCommand): Promise<PutObjectCommandOutput>;
  public send(
    command: GetObjectCommand | PutObjectCommand,
  ): Promise<GetObjectCommandOutput | PutObjectCommandOutput> {
    if (command instanceof GetObjectCommand) {
      return Promise.reject(new NoSuchKey({ message: "missing", $metadata: {} }));
    }
    this.putInputs.push(command.input);
    return Promise.resolve({ $metadata: {} });
  }
}

describe("S3ProcessingObjectStorage", () => {
  it("maps missing optional objects and writes private object metadata", async () => {
    const client = new MissingReadS3Client();
    const storage = new S3ProcessingObjectStorage(client, "asset-bucket", 100);

    await expect(storage.getOptional("missing.webp")).resolves.toBeNull();
    await storage.put({
      bytes: Uint8Array.from([1, 2, 3]),
      contentType: "image/webp",
      key: "users/user/jobs/job/preview.webp",
      metadata: { "processing-job-id": "job" },
    });

    expect(client.putInputs).toEqual([
      {
        Body: Uint8Array.from([1, 2, 3]),
        Bucket: "asset-bucket",
        ContentLength: 3,
        ContentType: "image/webp",
        Key: "users/user/jobs/job/preview.webp",
        Metadata: { "processing-job-id": "job" },
      },
    ]);
  });
});
