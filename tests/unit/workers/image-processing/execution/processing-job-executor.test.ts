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
import { CachedStudioSceneAssetSource } from "../../../../../workers/image-processing/src/studio-scene/cached-studio-scene-asset-source";
import { createClaimedJob } from "../test-support/create-claimed-job";
import {
  countPixels,
  createStudioFixtures,
  createVehicleCutout,
  FIXTURE_COLOURS,
} from "../test-support/studio-fixtures";

class MemoryStorage implements ProcessingObjectStoragePort {
  public readonly objects = new Map<string, StoredProcessingObject>();
  public readonly reads: string[] = [];

  public getOptional(key: string): Promise<StoredProcessingObject | null> {
    return Promise.resolve(this.objects.get(key) ?? null);
  }

  public getRequired(key: string): Promise<StoredProcessingObject> {
    this.reads.push(key);
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

const EXECUTOR_OPTIONS = {
  maximumInputBytes: 1_000_000,
  maximumPixels: 1_000_000,
  previewMaximumWidth: 320,
};

async function seedStudioAssets(storage: MemoryStorage): Promise<void> {
  for (const [key, bytes] of await createStudioFixtures()) {
    storage.objects.set(key, { bytes, contentType: "image/png", metadata: {} });
  }
}

function createExecutor(
  storage: MemoryStorage,
  provider: RecordingProvider,
): ProcessingJobExecutor {
  return new ProcessingJobExecutor(
    storage,
    provider,
    EXECUTOR_OPTIONS,
    new CachedStudioSceneAssetSource(storage),
  );
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
    await seedStudioAssets(storage);
    const executor = createExecutor(storage, provider);

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
    await seedStudioAssets(storage);
    const executor = createExecutor(storage, provider);

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
    await seedStudioAssets(storage);
    const executor = createExecutor(storage, provider);

    await expect(executor.execute(job)).resolves.toMatchObject({
      ok: true,
      providerLatencyMilliseconds: null,
      providerRequestId: "recovered-request",
    });
    expect(provider.inputs).toHaveLength(0);
  });

  describe("studio floors", () => {
    async function processWith(
      floorId: "DARK_STUDIO_FLOOR" | "DARK_TURNTABLE",
    ): Promise<{ output: Uint8Array; reads: string[] }> {
      const images = await createImages();
      const storage = new MemoryStorage();
      await seedStudioAssets(storage);
      const provider = new RecordingProvider(await createVehicleCutout());
      const job = createClaimedJob({
        options: {
          backgroundId: "DARK_STUDIO",
          crop: "FIT_VEHICLE",
          enhancement: false,
          floorId,
          outputFormat: "PNG",
          paddingPercent: 8,
          platePrivacy: false,
          quality: 90,
          shadow: "NONE",
        },
        sizeBytes: BigInt(images.source.byteLength),
      });
      storage.objects.set(job.originalObjectKey, {
        bytes: images.source,
        contentType: "image/jpeg",
        metadata: {},
      });

      const result = await createExecutor(storage, provider).execute(job);
      if (!result.ok) throw new Error(result.failure.errorMessage);
      const output = storage.objects.get(result.output.objectKey)?.bytes;
      if (!output) throw new Error("Expected a stored output.");
      return { output, reads: storage.reads };
    }

    // Regression: the floor was once ignored, so a turntable silently fell
    // back to the standard floor. This fails if `floorId` is not honoured.
    it("draws the turntable, not the standard floor, when one is chosen", async () => {
      const standard = await processWith("DARK_STUDIO_FLOOR");
      const turntable = await processWith("DARK_TURNTABLE");

      expect(standard.reads).toContain("studio-assets/v1/floors/floor-dark-studio.png");
      expect(standard.reads).not.toContain("studio-assets/v1/floors/floor-dark-turntable.png");
      expect(turntable.reads).toContain("studio-assets/v1/floors/floor-dark-turntable.png");
      expect(turntable.reads).not.toContain("studio-assets/v1/floors/floor-dark-studio.png");
      expect(await countPixels(standard.output, FIXTURE_COLOURS.turntable)).toBe(0);
      expect(await countPixels(turntable.output, FIXTURE_COLOURS.turntable)).toBeGreaterThan(1_000);
      expect(Buffer.compare(Buffer.from(standard.output), Buffer.from(turntable.output))).not.toBe(0);
    });

    it("keeps composing the standard floor with the background and vehicle", async () => {
      const { output, reads } = await processWith("DARK_STUDIO_FLOOR");

      expect(reads).toContain("studio-assets/v1/backgrounds/bg-dark-studio.webp");
      expect(await countPixels(output, FIXTURE_COLOURS.wall)).toBeGreaterThan(1_000);
      expect(await countPixels(output, FIXTURE_COLOURS.floor)).toBeGreaterThan(1_000);
      expect(await countPixels(output, FIXTURE_COLOURS.vehicle)).toBeGreaterThan(1_000);
    });

    it("fails retryably before paying the provider when a studio asset is missing", async () => {
      const images = await createImages();
      const storage = new MemoryStorage();
      const provider = new RecordingProvider(images.provider);
      const job = createClaimedJob({ sizeBytes: BigInt(images.source.byteLength) });
      storage.objects.set(job.originalObjectKey, {
        bytes: images.source,
        contentType: "image/jpeg",
        metadata: {},
      });

      await expect(createExecutor(storage, provider).execute(job)).resolves.toMatchObject({
        ok: false,
        failure: { kind: "NETWORK" },
      });
      expect(provider.inputs).toHaveLength(0);
    });

    it("reads the original background without studio assets or the provider", async () => {
      const images = await createImages();
      const storage = new MemoryStorage();
      const provider = new RecordingProvider(images.provider);
      const job = createClaimedJob({
        options: {
          backgroundId: "ORIGINAL",
          crop: "MAINTAIN_COMPOSITION",
          enhancement: false,
          outputFormat: "JPEG",
          paddingPercent: 0,
          platePrivacy: false,
          quality: 90,
          shadow: "NATURAL",
        },
        sizeBytes: BigInt(images.source.byteLength),
      });
      storage.objects.set(job.originalObjectKey, {
        bytes: images.source,
        contentType: "image/jpeg",
        metadata: {},
      });

      await expect(createExecutor(storage, provider).execute(job)).resolves.toMatchObject({ ok: true });
      expect(provider.inputs).toHaveLength(0);
      expect(storage.reads.some((key) => key.startsWith("studio-assets/"))).toBe(false);
    });
  });
});
