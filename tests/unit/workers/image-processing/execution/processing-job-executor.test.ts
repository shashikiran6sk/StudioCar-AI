import sharp from "sharp";
import { describe, expect, it } from "vitest";

import type {
  BackgroundRemovalProvider,
  ProcessImageInput,
  ProcessImageResult,
} from "../../../../../packages/processing/src/background-removal-provider.types";
import { ProcessingJobExecutor } from "../../../../../workers/image-processing/src/execution/processing-job-executor";
import type {
  ProcessingObjectStoragePort,
  PutProcessingObjectInput,
  StoredProcessingObject,
} from "../../../../../workers/image-processing/src/storage/processing-object-storage.types";
import { calculateSha256 } from "../../../../../workers/image-processing/src/execution/calculate-sha256";
import { createClaimedJob } from "../test-support/create-claimed-job";

class MemoryStorage implements ProcessingObjectStoragePort {
  public readonly objects = new Map<string, StoredProcessingObject>();

  public getOptional(key: string): Promise<StoredProcessingObject | null> {
    return Promise.resolve(this.objects.get(key) ?? null);
  }

  public getRequired(key: string): Promise<StoredProcessingObject> {
    const object = this.objects.get(key);
    if (!object) return Promise.reject(new Error("missing"));
    return Promise.resolve(object);
  }

  public put(input: PutProcessingObjectInput): Promise<void> {
    this.objects.set(input.key, {
      bytes: input.bytes,
      contentType: input.contentType,
      metadata: input.metadata,
    });
    return Promise.resolve();
  }
}

class RecordingProvider implements BackgroundRemovalProvider {
  public readonly key = "REMOVEBG";
  public readonly inputs: ProcessImageInput[] = [];

  public constructor(private readonly resultBytes: Uint8Array) {}

  public process(input: ProcessImageInput): Promise<ProcessImageResult> {
    this.inputs.push(input);
    return Promise.resolve({
      ok: true,
      result: {
        bytes: this.resultBytes,
        contentType: "image/webp",
        providerLatencyMilliseconds: 42,
        providerRequestId: "provider-request",
      },
    });
  }
}

async function createImages(): Promise<{
  provider: Uint8Array;
  source: Uint8Array;
}> {
  const source = await sharp({
    create: { background: "#135579", channels: 3, height: 40, width: 60 },
  })
    .jpeg()
    .toBuffer();
  const provider = await sharp({
    create: {
      background: { alpha: 0.5, b: 90, g: 60, r: 30 },
      channels: 4,
      height: 40,
      width: 60,
    },
  })
    .webp()
    .toBuffer();
  return { provider, source };
}

describe("ProcessingJobExecutor", () => {
  it("validates, stages, transforms, and stores deterministic outputs", async () => {
    const images = await createImages();
    const storage = new MemoryStorage();
    const provider = new RecordingProvider(images.provider);
    const job = createClaimedJob({
      checksumSha256: calculateSha256(images.source),
      sizeBytes: BigInt(images.source.byteLength),
    });
    storage.objects.set(job.originalObjectKey, {
      bytes: images.source,
      contentType: "image/jpeg",
      metadata: {},
    });
    const executor = new ProcessingJobExecutor(storage, provider, {
      maximumInputBytes: 1_000_000,
      maximumPixels: 1_000_000,
      previewMaximumWidth: 320,
    });

    const result = await executor.execute(job);

    expect(result).toMatchObject({
      ok: true,
      providerLatencyMilliseconds: 42,
      providerRequestId: "provider-request",
    });
    expect(provider.inputs).toHaveLength(1);
    expect(provider.inputs[0]).toMatchObject({
      contentType: "image/jpeg",
      idempotencyKey: job.id,
      shadow: "NATURAL",
    });
    const outputKeys = [...storage.objects.keys()].filter((key) =>
      key.includes(`/jobs/${job.id}/`),
    );
    expect(outputKeys.some((key) => key.endsWith("provider-result.webp"))).toBe(
      true,
    );
    expect(outputKeys.some((key) => key.endsWith("processed.jpg"))).toBe(true);
    expect(outputKeys.some((key) => key.endsWith("preview.webp"))).toBe(true);
  });

  it("rejects tampered source bytes before calling the provider", async () => {
    const images = await createImages();
    const storage = new MemoryStorage();
    const provider = new RecordingProvider(images.provider);
    const job = createClaimedJob({
      checksumSha256: "0".repeat(64),
      sizeBytes: BigInt(images.source.byteLength),
    });
    storage.objects.set(job.originalObjectKey, {
      bytes: images.source,
      contentType: "image/jpeg",
      metadata: {},
    });
    const executor = new ProcessingJobExecutor(storage, provider, {
      maximumInputBytes: 1_000_000,
      maximumPixels: 1_000_000,
      previewMaximumWidth: 320,
    });

    await expect(executor.execute(job)).resolves.toMatchObject({
      ok: false,
      failure: { kind: "INVALID_IMAGE" },
    });
    expect(provider.inputs).toHaveLength(0);
  });

  it("reuses a staged provider result after a finalization interruption", async () => {
    const images = await createImages();
    const storage = new MemoryStorage();
    const provider = new RecordingProvider(images.provider);
    const job = createClaimedJob({ sizeBytes: BigInt(images.source.byteLength) });
    storage.objects.set(job.originalObjectKey, {
      bytes: images.source,
      contentType: "image/jpeg",
      metadata: {},
    });
    storage.objects.set(
      `users/${job.userId}/vehicles/${job.vehicleId}/assets/${job.imageAssetId}/jobs/${job.id}/provider-result.webp`,
      {
        bytes: images.provider,
        contentType: "image/webp",
        metadata: {
          "checksum-sha256": calculateSha256(images.provider),
          "provider-request-id": "recovered-request",
        },
      },
    );
    const executor = new ProcessingJobExecutor(storage, provider, {
      maximumInputBytes: 1_000_000,
      maximumPixels: 1_000_000,
      previewMaximumWidth: 320,
    });

    await expect(executor.execute(job)).resolves.toMatchObject({
      ok: true,
      providerLatencyMilliseconds: null,
      providerRequestId: "recovered-request",
    });
    expect(provider.inputs).toHaveLength(0);
  });
});
