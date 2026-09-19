import { describe, expect, it } from "vitest";

import { ProcessingOptionsSchema } from "../../../packages/contracts/src/processing";
import { WorkerMessageSchema } from "../../../packages/contracts/src/worker";
import { ProcessingWorker } from "../../../packages/processing/src/processing-worker";
import type {
  ClaimProcessingJobResult,
  CompleteProcessingJobInput,
  CompleteProcessingJobResult,
  FailProcessingJobInput,
  FailProcessingJobResult,
  ProcessingExecutionResult,
  ProcessingJobExecutorPort,
  ProcessingWorkerRepositoryPort,
} from "../../../packages/processing/src/processing-worker.types";

const JOB_ID = "4d5cff83-d20b-468b-928f-3a93643cfe9b";
const ASSET_ID = "87026a4c-22e2-40ce-b538-2bdff1e7dca1";
const VEHICLE_ID = "c81a8b46-531e-4739-abf2-9460d94b62e2";
const USER_ID = "e907c727-d3bc-4778-b622-40583b469dc4";
const COMPLETED_ASSET_ID = "5f403fde-6a1e-462b-921e-441277cdd930";

const claimedJob: ClaimProcessingJobResult = {
  kind: "CLAIMED",
  job: {
    attemptNumber: 1,
    checksumSha256: "a".repeat(64),
    id: JOB_ID,
    imageAssetId: ASSET_ID,
    mimeType: "image/jpeg",
    options: ProcessingOptionsSchema.parse({}),
    originalObjectKey: "users/user/vehicles/vehicle/assets/asset/original/source.jpg",
    provider: "REMOVEBG",
    sizeBytes: 1_024n,
    userId: USER_ID,
    vehicleId: VEHICLE_ID,
  },
};

class StubRepository implements ProcessingWorkerRepositoryPort {
  public readonly completions: CompleteProcessingJobInput[] = [];
  public readonly failures: FailProcessingJobInput[] = [];

  public constructor(
    private readonly claim: ClaimProcessingJobResult,
    private readonly completion: CompleteProcessingJobResult = {
      kind: "COMPLETED",
      processedAssetId: COMPLETED_ASSET_ID,
    },
    private readonly failure: FailProcessingJobResult = { kind: "FAILED" },
  ) {}

  public claimJob(): Promise<ClaimProcessingJobResult> {
    return Promise.resolve(this.claim);
  }

  public completeJob(
    input: CompleteProcessingJobInput,
  ): Promise<CompleteProcessingJobResult> {
    this.completions.push(input);
    return Promise.resolve(this.completion);
  }

  public failJob(
    input: FailProcessingJobInput,
  ): Promise<FailProcessingJobResult> {
    this.failures.push(input);
    return Promise.resolve(this.failure);
  }
}

class StubExecutor implements ProcessingJobExecutorPort {
  public constructor(
    private readonly result: ProcessingExecutionResult,
    private readonly shouldThrow = false,
  ) {}

  public execute(): Promise<ProcessingExecutionResult> {
    if (this.shouldThrow) return Promise.reject(new Error("executor failure"));
    return Promise.resolve(this.result);
  }
}

function createMessage() {
  return WorkerMessageSchema.parse({
    version: 1,
    type: "PROCESS_IMAGE",
    jobId: JOB_ID,
    enqueuedAt: "2026-09-20T00:00:00.000Z",
  });
}

describe("ProcessingWorker", () => {
  it("completes a claim with one usage period and idempotency key", async () => {
    const repository = new StubRepository(claimedJob);
    const executor = new StubExecutor({
      ok: true,
      output: {
        checksumSha256: "b".repeat(64),
        height: 900,
        mimeType: "image/png",
        objectKey: "processed.png",
        outputFormat: "PNG",
        previewObjectKey: "preview.webp",
        sizeBytes: 2_048n,
        width: 1_600,
      },
      providerLatencyMilliseconds: 850,
      providerRequestId: "provider-request-1",
    });
    const worker = new ProcessingWorker(
      repository,
      executor,
      {
        claimTtlMilliseconds: 30_000,
        retryBaseMilliseconds: 1_000,
        retryMaximumMilliseconds: 60_000,
      },
      () => new Date("2026-09-20T00:01:00.000Z"),
      () => "worker-1",
    );

    await expect(worker.process(createMessage())).resolves.toEqual({
      kind: "COMPLETED",
      processedAssetId: COMPLETED_ASSET_ID,
    });
    expect(repository.completions).toHaveLength(1);
    expect(repository.completions[0]).toMatchObject({
      usageBillingPeriodKey: "2026-09",
      usageIdempotencyKey: `processing-job:${JOB_ID}:background-removal-completed`,
      workerId: "worker-1",
    });
  });

  it("durably schedules a retryable provider failure", async () => {
    const nextAttemptAt = new Date("2026-09-20T00:01:00.500Z");
    const repository = new StubRepository(claimedJob, undefined, {
      kind: "RETRY_SCHEDULED",
      nextAttemptAt,
    });
    const executor = new StubExecutor({
      ok: false,
      failure: {
        errorMessage: "Provider rate limited the request.",
        kind: "PROVIDER_429",
        providerLatencyMilliseconds: 50,
        providerRequestId: null,
      },
    });
    const worker = new ProcessingWorker(
      repository,
      executor,
      {
        claimTtlMilliseconds: 30_000,
        retryBaseMilliseconds: 1_000,
        retryMaximumMilliseconds: 60_000,
      },
      () => new Date("2026-09-20T00:01:00.000Z"),
      () => "worker-2",
      () => 0,
    );

    await expect(worker.process(createMessage())).resolves.toEqual({
      kind: "RETRY_SCHEDULED",
      nextAttemptAt,
    });
    expect(repository.failures[0]).toMatchObject({
      errorCode: "PROVIDER_RATE_LIMITED",
      nextAttemptAt,
      retryable: true,
      workerId: "worker-2",
    });
  });

  it("retries the queue delivery when execution throws unexpectedly", async () => {
    const repository = new StubRepository(claimedJob);
    const executor = new StubExecutor(
      {
        ok: false,
        failure: {
          errorMessage: "unused",
          kind: "INTERNAL",
          providerLatencyMilliseconds: null,
          providerRequestId: null,
        },
      },
      true,
    );
    const worker = new ProcessingWorker(repository, executor, {
      claimTtlMilliseconds: 30_000,
      retryBaseMilliseconds: 1_000,
      retryMaximumMilliseconds: 60_000,
    });

    await expect(worker.process(createMessage())).resolves.toEqual({
      kind: "RETRY_DELIVERY",
    });
    expect(repository.completions).toEqual([]);
    expect(repository.failures).toEqual([]);
  });

  it("ignores duplicate deliveries for terminal jobs", async () => {
    const repository = new StubRepository({ kind: "TERMINAL" });
    const executor = new StubExecutor({
      ok: false,
      failure: {
        errorMessage: "unused",
        kind: "INTERNAL",
        providerLatencyMilliseconds: null,
        providerRequestId: null,
      },
    });
    const worker = new ProcessingWorker(repository, executor, {
      claimTtlMilliseconds: 30_000,
      retryBaseMilliseconds: 1_000,
      retryMaximumMilliseconds: 60_000,
    });

    await expect(worker.process(createMessage())).resolves.toEqual({
      kind: "IGNORED",
      reason: "TERMINAL",
    });
  });
});
