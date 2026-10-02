import sharp from "sharp";
import { describe, expect, it } from "vitest";

import type {
  BackgroundRemovalRequest,
  BackgroundRemovalResult,
  ImageProcessingProvider,
} from "../../../../../packages/processing/src/image-processing-provider.types";
import type {
  ClaimedProcessingJob,
  ProviderFailure,
} from "../../../../../packages/processing/src/processing-worker.types";
import { buildProcessingObjectKeys } from "../../../../../workers/image-processing/src/execution/build-processing-object-keys";
import { calculateSha256 } from "../../../../../workers/image-processing/src/execution/calculate-sha256";
import { FileStudioBackgroundSource } from "../../../../../workers/image-processing/src/execution/file-studio-background-source";
import { ProcessingJobExecutor } from "../../../../../workers/image-processing/src/execution/processing-job-executor";
import type { StudioBackgroundSource } from "../../../../../workers/image-processing/src/execution/studio-background.types";
import type {
  ProcessingObjectStoragePort,
  PutProcessingObjectInput,
  StoredProcessingObject,
} from "../../../../../workers/image-processing/src/storage/processing-object-storage.types";
import { createClaimedJob } from "../test-support/create-claimed-job";
import { createCutout, encodeCutout } from "../test-support/create-cutout";
import { STUDIO_BACKGROUND_DIRECTORY } from "../test-support/load-studio-background";

const OPTIONS = {
  maximumInputBytes: 5 * 1024 * 1024,
  maximumPixels: 10_000_000,
  previewMaximumWidth: 320,
};

class MemoryStorage implements ProcessingObjectStoragePort {
  public readonly objects = new Map<string, StoredProcessingObject>();
  public failPutFor: RegExp | null = null;
  public failGets = false;

  public getOptional(key: string): Promise<StoredProcessingObject | null> {
    if (this.failGets) return Promise.reject(new Error("S3 unavailable"));
    return Promise.resolve(this.objects.get(key) ?? null);
  }

  public getRequired(key: string): Promise<StoredProcessingObject> {
    if (this.failGets) return Promise.reject(new Error("S3 unavailable"));
    const object = this.objects.get(key);
    if (!object) return Promise.reject(new Error("missing"));
    return Promise.resolve(object);
  }

  public put(input: PutProcessingObjectInput): Promise<void> {
    if (this.failPutFor?.test(input.key)) {
      return Promise.reject(new Error("S3 unavailable"));
    }
    this.objects.set(input.key, {
      bytes: input.bytes,
      contentType: input.contentType,
      metadata: input.metadata,
    });
    return Promise.resolve();
  }
}

class RecordingProvider implements ImageProcessingProvider {
  public readonly key = "LEONARDO";
  public readonly requests: BackgroundRemovalRequest[] = [];

  public constructor(
    private readonly response:
      | { bytes: Uint8Array; height: number; width: number }
      | ProviderFailure,
  ) {}

  public removeBackground(
    request: BackgroundRemovalRequest,
  ): Promise<BackgroundRemovalResult> {
    this.requests.push(request);
    if ("kind" in this.response) {
      return Promise.resolve({ ok: false, failure: this.response });
    }
    return Promise.resolve({
      ok: true,
      cutout: {
        ...this.response,
        contentType: "image/webp",
        providerLatencyMilliseconds: 4_200,
        providerRequestId: "generation-1",
      },
    });
  }
}

const backgrounds = new FileStudioBackgroundSource(STUDIO_BACKGROUND_DIRECTORY);

async function setup(
  job: Partial<ClaimedProcessingJob> = {},
  provider?: RecordingProvider,
  backgroundSource: StudioBackgroundSource = backgrounds,
) {
  const cutout = createCutout();
  const cutoutBytes = await encodeCutout(cutout);
  const source = await sharp({
    create: { background: "#6d6a66", channels: 3, height: cutout.height, width: cutout.width },
  })
    .jpeg()
    .toBuffer();
  const storage = new MemoryStorage();
  const claimed = createClaimedJob({
    checksumSha256: calculateSha256(source),
    sizeBytes: BigInt(source.byteLength),
    ...job,
  });
  storage.objects.set(claimed.originalObjectKey, {
    bytes: source,
    contentType: "image/jpeg",
    metadata: {},
  });
  const recording =
    provider ??
    new RecordingProvider({ bytes: cutoutBytes, height: cutout.height, width: cutout.width });
  return {
    cutoutBytes,
    executor: new ProcessingJobExecutor(storage, recording, backgroundSource, OPTIONS),
    job: claimed,
    keys: buildProcessingObjectKeys(claimed),
    provider: recording,
    source,
    storage,
  };
}

describe("ProcessingJobExecutor", () => {
  it("runs on the provider it was given", async () => {
    const { executor } = await setup();
    expect(executor.providerKey).toBe("LEONARDO");
  });

  it("validates the original, stages the provider cutout, composes and stores WebP outputs", async () => {
    const { executor, job, keys, provider, storage, cutoutBytes } = await setup();
    const result = await executor.execute(job);

    expect(provider.requests).toEqual([
      {
        correlation: { assetId: job.imageAssetId, attempt: 1, vehicleId: job.vehicleId },
        jobId: job.id,
        qualityTier: "STANDARD",
        sourceObjectKey: job.originalObjectKey,
      },
    ]);
    const staged = storage.objects.get(keys.providerCutout);
    expect(staged?.bytes).toEqual(cutoutBytes);
    expect(staged?.metadata).toEqual({
      "checksum-sha256": calculateSha256(cutoutBytes),
      "processing-job-id": job.id,
      "provider-request-id": "generation-1",
    });
    const output = storage.objects.get(keys.output);
    const preview = storage.objects.get(keys.preview);
    expect(output?.contentType).toBe("image/webp");
    expect(preview?.contentType).toBe("image/webp");
    if (!output || !preview) throw new Error("Expected stored outputs.");
    // Maintained composition: the 640×400 frame plus 8% (32 px) of padding.
    expect(await sharp(output.bytes).metadata()).toMatchObject({
      format: "webp",
      height: 464,
      width: 704,
    });
    expect((await sharp(preview.bytes).metadata()).width).toBe(320);
    expect(result).toEqual({
      ok: true,
      output: {
        checksumSha256: calculateSha256(output.bytes),
        height: 464,
        mimeType: "image/webp",
        objectKey: keys.output,
        outputFormat: "WEBP",
        previewObjectKey: keys.preview,
        sizeBytes: BigInt(output.bytes.byteLength),
        width: 704,
      },
      providerLatencyMilliseconds: 4_200,
      providerRequestId: "generation-1",
    });
  });

  it.each([
    [null, "STANDARD"],
    ["FREE", "STANDARD"],
    ["STUDIO_PLUS", "HIGH"],
    ["STUDIO_PRO", "HIGH"],
    ["RETIRED_STUDIO_PLUS", "STANDARD"],
  ])(
    "asks the provider for the %s plan's resolution (%s) from the server-side subscription alone",
    async (subscriptionPlanKey, qualityTier) => {
      const { executor, job, provider } = await setup({ subscriptionPlanKey });
      await executor.execute(job);
      expect(provider.requests[0]?.qualityTier).toBe(qualityTier);
    },
  );

  it("rejects tampered source bytes before paying the provider", async () => {
    const { executor, job, provider } = await setup({ checksumSha256: "0".repeat(64) });
    await expect(executor.execute(job)).resolves.toMatchObject({
      ok: false,
      failure: { kind: "INVALID_IMAGE", stage: "SOURCE" },
    });
    expect(provider.requests).toHaveLength(0);
  });

  it("rejects a source whose size does not match its upload", async () => {
    const { executor, job, provider } = await setup({ sizeBytes: 12n });
    await expect(executor.execute(job)).resolves.toMatchObject({
      ok: false,
      failure: { kind: "INVALID_IMAGE", stage: "SOURCE" },
    });
    expect(provider.requests).toHaveLength(0);
  });

  it("rejects an undecodable original before paying the provider", async () => {
    const { executor, job, provider, storage } = await setup();
    const garbage = Buffer.from("definitely not a jpeg");
    storage.objects.set(job.originalObjectKey, { bytes: garbage, contentType: "image/jpeg", metadata: {} });
    const broken = { ...job, checksumSha256: calculateSha256(garbage), sizeBytes: BigInt(garbage.byteLength) };
    await expect(executor.execute(broken)).resolves.toMatchObject({
      ok: false,
      failure: { kind: "INVALID_IMAGE", stage: "SOURCE" },
    });
    expect(provider.requests).toHaveLength(0);
  });

  it("reuses a staged cutout on retry instead of paying the provider again", async () => {
    const { executor, job, keys, provider, storage, cutoutBytes } = await setup();
    storage.objects.set(keys.providerCutout, {
      bytes: cutoutBytes,
      contentType: "image/webp",
      metadata: {
        "checksum-sha256": calculateSha256(cutoutBytes),
        "provider-request-id": "earlier-generation",
      },
    });
    await expect(executor.execute({ ...job, attemptNumber: 2 })).resolves.toMatchObject({
      ok: true,
      providerLatencyMilliseconds: null,
      providerRequestId: "earlier-generation",
    });
    expect(provider.requests).toHaveLength(0);
  });

  it("does not trust a staged cutout whose checksum no longer matches", async () => {
    const { executor, job, keys, provider, storage } = await setup();
    storage.objects.set(keys.providerCutout, {
      bytes: Buffer.from("corrupted"),
      contentType: "image/webp",
      metadata: { "checksum-sha256": "f".repeat(64) },
    });
    await expect(executor.execute(job)).resolves.toMatchObject({ ok: true });
    expect(provider.requests).toHaveLength(1);
  });

  it("returns a provider failure, its retry hint and no outputs", async () => {
    const failure: ProviderFailure = {
      errorMessage: "rate limited",
      kind: "PROVIDER_429",
      providerLatencyMilliseconds: 120,
      providerRequestId: null,
      retryAfterMilliseconds: 30_000,
    };
    const { executor, job, keys, storage } = await setup({}, new RecordingProvider(failure));
    await expect(executor.execute(job)).resolves.toEqual({
      ok: false,
      failure: { ...failure, stage: "PROVIDER" },
    });
    expect(storage.objects.has(keys.providerCutout)).toBe(false);
    expect(storage.objects.has(keys.output)).toBe(false);
  });

  it("treats a cutout with no vehicle as a non-car photo, keeping the paid cutout staged", async () => {
    const empty = await sharp({
      create: { background: { alpha: 0, b: 0, g: 0, r: 0 }, channels: 4, height: 400, width: 640 },
    })
      .webp({ lossless: true })
      .toBuffer();
    const { executor, job, keys, storage } = await setup(
      {},
      new RecordingProvider({ bytes: empty, height: 400, width: 640 }),
    );
    await expect(executor.execute(job)).resolves.toMatchObject({
      ok: false,
      failure: {
        kind: "NON_CAR_IMAGE",
        providerRequestId: "generation-1",
        stage: "PROVIDER",
      },
    });
    expect(storage.objects.has(keys.providerCutout)).toBe(true);
    expect(storage.objects.has(keys.output)).toBe(false);
  });

  it("reports an undecodable cutout as a composition failure attributed to its generation", async () => {
    const { executor, job } = await setup(
      {},
      new RecordingProvider({ bytes: Buffer.from("not webp"), height: 1, width: 1 }),
    );
    await expect(executor.execute(job)).resolves.toMatchObject({
      ok: false,
      failure: { kind: "INTERNAL", providerRequestId: "generation-1", stage: "COMPOSITION" },
    });
  });

  it("reports a missing background as a composition failure", async () => {
    const missing: StudioBackgroundSource = {
      read: () => Promise.reject(new Error("ENOENT")),
    };
    const { executor, job } = await setup({}, undefined, missing);
    await expect(executor.execute(job)).resolves.toMatchObject({
      ok: false,
      failure: { kind: "INTERNAL", stage: "COMPOSITION" },
    });
  });

  it("reports an output write failure as retryable storage, after staging the cutout", async () => {
    const { executor, job, keys, storage } = await setup();
    storage.failPutFor = /processed\.webp$/;
    await expect(executor.execute(job)).resolves.toMatchObject({
      ok: false,
      failure: {
        kind: "NETWORK",
        providerRequestId: "generation-1",
        stage: "STORAGE",
      },
    });
    expect(storage.objects.has(keys.providerCutout)).toBe(true);
  });

  it("reports unreadable private storage as retryable storage", async () => {
    const { executor, job, provider, storage } = await setup();
    storage.failGets = true;
    await expect(executor.execute(job)).resolves.toMatchObject({
      ok: false,
      failure: { kind: "NETWORK", stage: "STORAGE" },
    });
    expect(provider.requests).toHaveLength(0);
  });

  it("keeps an original photo in its frame without calling the provider", async () => {
    const { executor, job, keys, provider, storage } = await setup({
      options: { ...createClaimedJob().options, background: "ORIGINAL" },
    });
    await expect(executor.execute(job)).resolves.toMatchObject({
      ok: true,
      output: { height: 400, width: 640 },
      providerRequestId: null,
    });
    expect(provider.requests).toHaveLength(0);
    expect(storage.objects.has(keys.providerCutout)).toBe(false);
  });
});
