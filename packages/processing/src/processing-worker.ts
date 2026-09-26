import { randomUUID } from "node:crypto";
import type { WorkerMessage } from "@studiocar/contracts";

import { calculateProcessingRetryDelay } from "./calculate-processing-retry-delay";
import { classifyProcessingFailure } from "./classify-processing-failure";
import { createProcessingUsageIdempotencyKey } from "./create-processing-usage-idempotency-key";
import { createUsageBillingPeriodKey } from "./create-usage-billing-period-key";
import { normalizeProcessingErrorMessage } from "./normalize-processing-error-message";
import {
  PROCESSING_PUBLICATION_WAIT_ATTEMPTS,
  PROCESSING_PUBLICATION_WAIT_MS,
} from "./processing-worker.constants";
import type {
  ClaimProcessingJobResult,
  ProcessingJobExecutorPort,
  ProcessingWorkerOptions,
  ProcessingWorkerRepositoryPort,
  ProcessWorkerMessageResult,
} from "./processing-worker.types";
import { validateProcessingWorkerOptions } from "./validate-processing-worker-options";

export class ProcessingWorker {
  public constructor(
    private readonly jobs: ProcessingWorkerRepositoryPort,
    private readonly executor: ProcessingJobExecutorPort,
    private readonly options: ProcessingWorkerOptions,
    private readonly now: () => Date = () => new Date(),
    private readonly createWorkerId: () => string = randomUUID,
    private readonly random: () => number = Math.random,
    private readonly sleep: (milliseconds: number) => Promise<void> = (
      milliseconds,
    ) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
  ) {
    validateProcessingWorkerOptions(options);
  }

  public async process(
    message: WorkerMessage,
  ): Promise<ProcessWorkerMessageResult> {
    const workerId = this.createWorkerId();
    const claim = await this.claim(message.jobId, workerId);
    if (claim.kind === "AWAITING_PUBLICATION" || claim.kind === "CLAIM_BUSY") {
      // Never drop the job's only message: the queue delivers it again.
      return { kind: "RETRY_DELIVERY" };
    }
    if (claim.kind !== "CLAIMED") {
      return { kind: "IGNORED", reason: claim.kind };
    }
    const telemetry = {
      assetId: claim.job.imageAssetId,
      attemptNumber: claim.job.attemptNumber,
      failureKind: null,
      provider: claim.job.provider,
      providerLatencyMilliseconds: null,
      providerRequestId: null,
      userId: claim.job.userId,
      vehicleId: claim.job.vehicleId,
    } satisfies ProcessWorkerMessageResult["telemetry"];

    const execution = await this.executor.execute(claim.job);

    if (execution.ok) {
      const completedAt = this.now();
      const completion = await this.jobs.completeJob({
        attemptNumber: claim.job.attemptNumber,
        completedAt,
        jobId: claim.job.id,
        output: execution.output,
        providerLatencyMilliseconds: execution.providerLatencyMilliseconds,
        providerRequestId: execution.providerRequestId,
        usageBillingPeriodKey: createUsageBillingPeriodKey(completedAt),
        usageIdempotencyKey: createProcessingUsageIdempotencyKey(claim.job.id),
        workerId,
      });
      if (
        completion.kind === "COMPLETED" ||
        completion.kind === "ALREADY_COMPLETED"
      ) {
        return {
          kind: "COMPLETED",
          processedAssetId: completion.processedAssetId,
          telemetry: {
            ...telemetry,
            providerLatencyMilliseconds: execution.providerLatencyMilliseconds,
            providerRequestId: execution.providerRequestId,
          },
        };
      }
      return {
        kind: "RETRY_DELIVERY",
        telemetry: {
          ...telemetry,
          providerLatencyMilliseconds: execution.providerLatencyMilliseconds,
          providerRequestId: execution.providerRequestId,
        },
      };
    }

    const classification = classifyProcessingFailure(execution.failure.kind);
    const failedAt = this.now();
    const retryDelay = calculateProcessingRetryDelay(
      claim.job.attemptNumber,
      this.options.retryBaseMilliseconds,
      this.options.retryMaximumMilliseconds,
      this.random(),
    );
    const failure = await this.jobs.failJob({
      attemptNumber: claim.job.attemptNumber,
      errorCode: classification.errorCode,
      errorMessage: normalizeProcessingErrorMessage(
        execution.failure.errorMessage,
      ),
      failedAt,
      jobId: claim.job.id,
      nextAttemptAt: new Date(failedAt.getTime() + retryDelay),
      providerLatencyMilliseconds:
        execution.failure.providerLatencyMilliseconds,
      providerRequestId: execution.failure.providerRequestId,
      retryable: classification.retryable,
      workerId,
    });
    if (failure.kind === "RETRY_SCHEDULED") {
      return {
        kind: "RETRY_SCHEDULED",
        nextAttemptAt: failure.nextAttemptAt,
        telemetry: {
          ...telemetry,
          failureKind: execution.failure.kind,
          providerLatencyMilliseconds:
            execution.failure.providerLatencyMilliseconds,
          providerRequestId: execution.failure.providerRequestId,
        },
      };
    }
    if (failure.kind === "FAILED") {
      return {
        kind: "FAILED",
        telemetry: {
          ...telemetry,
          failureKind: execution.failure.kind,
          providerLatencyMilliseconds:
            execution.failure.providerLatencyMilliseconds,
          providerRequestId: execution.failure.providerRequestId,
        },
      };
    }
    return {
      kind: "RETRY_DELIVERY",
      telemetry: {
        ...telemetry,
        failureKind: execution.failure.kind,
        providerLatencyMilliseconds:
          execution.failure.providerLatencyMilliseconds,
        providerRequestId: execution.failure.providerRequestId,
      },
    };
  }

  /**
   * Claims the job, waiting briefly for one whose message arrived before the
   * dispatcher recorded it as queued.
   */
  private async claim(
    jobId: string,
    workerId: string,
  ): Promise<ClaimProcessingJobResult> {
    for (let attempt = 1; ; attempt += 1) {
      const claimedAt = this.now();
      const claim = await this.jobs.claimJob({
        claimExpiresAt: new Date(
          claimedAt.getTime() + this.options.claimTtlMilliseconds,
        ),
        jobId,
        now: claimedAt,
        workerId,
      });
      if (
        claim.kind !== "AWAITING_PUBLICATION" ||
        attempt >= PROCESSING_PUBLICATION_WAIT_ATTEMPTS
      ) {
        return claim;
      }
      await this.sleep(PROCESSING_PUBLICATION_WAIT_MS);
    }
  }
}
