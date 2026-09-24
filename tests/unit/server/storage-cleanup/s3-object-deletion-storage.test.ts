import { NoSuchKey, S3Client } from "@aws-sdk/client-s3";
import { describe, expect, it, vi } from "vitest";

import { S3ObjectDeletionStorage } from "../../../../apps/web/src/server/storage-cleanup/s3-object-deletion-storage";

describe("S3ObjectDeletionStorage", () => {
  it("deletes only the authoritative private object key", async () => {
    const client = new S3Client({
      region: "ap-south-1",
      credentials: { accessKeyId: "test", secretAccessKey: "test" },
    });
    const sendDeleteObject = vi.fn(async (command) => {
      expect(command.input).toEqual({
        Bucket: "private-assets",
        Key: "users/user-1/assets/asset-1/original/source.png",
      });
      return {};
    });
    const storage = new S3ObjectDeletionStorage(
      client,
      "private-assets",
      sendDeleteObject,
    );

    await expect(
      storage.deleteObject(
        "users/user-1/assets/asset-1/original/source.png",
      ),
    ).resolves.toBeUndefined();
    expect(sendDeleteObject).toHaveBeenCalledOnce();
    client.destroy();
  });

  it("treats an already absent object as an idempotent success", async () => {
    const client = new S3Client({
      region: "ap-south-1",
      credentials: { accessKeyId: "test", secretAccessKey: "test" },
    });
    const sendDeleteObject = vi.fn(async () => {
      throw new NoSuchKey({ message: "missing", $metadata: {} });
    });
    const storage = new S3ObjectDeletionStorage(
      client,
      "private-assets",
      sendDeleteObject,
    );

    await expect(storage.deleteObject("already-absent.jpg")).resolves.toBeUndefined();
    expect(sendDeleteObject).toHaveBeenCalledOnce();
    client.destroy();
  });

  it("propagates storage failures other than an absent object", async () => {
    const client = new S3Client({
      region: "ap-south-1",
      credentials: { accessKeyId: "test", secretAccessKey: "test" },
    });
    const sendDeleteObject = vi.fn(async () => {
      throw new Error("storage unavailable");
    });
    const storage = new S3ObjectDeletionStorage(
      client,
      "private-assets",
      sendDeleteObject,
    );

    await expect(storage.deleteObject("source.jpg")).rejects.toThrow(
      "storage unavailable",
    );
    client.destroy();
  });
});
