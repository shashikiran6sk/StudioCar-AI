import {
  HeadObjectCommand,
  NoSuchKey,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { describe, expect, it } from "vitest";

import { calculateSha256 } from "../../../../../workers/image-processing/src/execution/calculate-sha256";
import { syncStudioAssets } from "../../../../../workers/image-processing/src/studio-assets/sync-studio-assets";
import type { StudioAssetSyncClient } from "../../../../../workers/image-processing/src/studio-assets/sync-studio-assets.types";

const BUCKET = "configured-development-bucket";

/** An in-memory bucket that records every command it receives. */
class FakeBucket implements StudioAssetSyncClient {
  public readonly checksums = new Map<string, string>();
  public readonly puts: PutObjectCommand["input"][] = [];

  public send(command: HeadObjectCommand): Promise<{ $metadata: object; Metadata?: Record<string, string> }>;
  public send(command: PutObjectCommand): Promise<{ $metadata: object }>;
  public send(command: HeadObjectCommand | PutObjectCommand) {
    if (command instanceof PutObjectCommand) {
      this.puts.push(command.input);
      const checksum = command.input.Metadata?.["checksum-sha256"];
      if (command.input.Key && checksum) this.checksums.set(command.input.Key, checksum);
      return Promise.resolve({ $metadata: {} });
    }
    const checksum = command.input.Key ? this.checksums.get(command.input.Key) : undefined;
    if (checksum === undefined) {
      return Promise.reject(new NoSuchKey({ $metadata: {}, message: "missing" }));
    }
    return Promise.resolve({ $metadata: {}, Metadata: { "checksum-sha256": checksum } });
  }
}

function readAsset(objectKey: string): Promise<Uint8Array> {
  return Promise.resolve(new TextEncoder().encode(`bytes of ${objectKey}`));
}

describe("syncStudioAssets", () => {
  it("uploads every asset to the configured bucket with its media type", async () => {
    const bucket = new FakeBucket();

    const results = await syncStudioAssets({ bucket: BUCKET, client: bucket, readAsset, replace: false });

    expect(results).toHaveLength(9);
    expect(results.every((result) => result.outcome === "UPLOADED")).toBe(true);
    expect(bucket.puts.every((put) => put.Bucket === BUCKET)).toBe(true);
    expect(bucket.puts.every((put) => put.Key?.startsWith("studio-assets/v1/"))).toBe(true);
    const turntable = bucket.puts.find((put) => put.Key === "studio-assets/v1/floors/floor-grey-turntable.png");
    expect(turntable).toMatchObject({ ContentType: "image/png" });
    const background = bucket.puts.find((put) => put.Key === "studio-assets/v1/backgrounds/bg-grey-studio.webp");
    expect(background).toMatchObject({ ContentType: "image/webp" });
  });

  it("skips an asset that is already stored unchanged", async () => {
    const bucket = new FakeBucket();
    await syncStudioAssets({ bucket: BUCKET, client: bucket, readAsset, replace: false });

    const results = await syncStudioAssets({ bucket: BUCKET, client: bucket, readAsset, replace: false });

    expect(results.every((result) => result.outcome === "UNCHANGED")).toBe(true);
    expect(bucket.puts).toHaveLength(9);
  });

  it("refuses to overwrite a different asset under the same versioned key", async () => {
    const bucket = new FakeBucket();
    bucket.checksums.set("studio-assets/v1/backgrounds/bg-premium-white.webp", calculateSha256(new Uint8Array([1])));

    await expect(
      syncStudioAssets({ bucket: BUCKET, client: bucket, readAsset, replace: false }),
    ).rejects.toThrow(/new version/);
    expect(bucket.puts).toHaveLength(0);
  });

  it("replaces a changed asset only when asked to", async () => {
    const bucket = new FakeBucket();
    bucket.checksums.set("studio-assets/v1/backgrounds/bg-premium-white.webp", calculateSha256(new Uint8Array([1])));

    const results = await syncStudioAssets({ bucket: BUCKET, client: bucket, readAsset, replace: true });

    expect(results[0]).toEqual({
      objectKey: "studio-assets/v1/backgrounds/bg-premium-white.webp",
      outcome: "REPLACED",
    });
  });
});
