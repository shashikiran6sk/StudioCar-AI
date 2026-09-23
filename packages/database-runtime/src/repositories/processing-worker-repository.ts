import { ProcessingOptionsSchema } from "@studiocar/contracts";
import {
  PROCESSING_FAILURE_CODES,
  type ClaimProcessingJobInput,
  type ClaimProcessingJobResult,
  type CompleteProcessingJobInput,
  type CompleteProcessingJobResult,
  type FailProcessingJobInput,
  type FailProcessingJobResult,
  type ProcessingWorkerRepositoryPort,
} from "@studiocar/processing";

import type {
  Prisma,
  PrismaClient,
} from "../../generated/prisma/client";
import {
  EmailMessageType,
  ImageAssetStatus,
  ProcessingAttemptStatus,
  ProcessingJobStatus,
  UsageEventType,
  VehicleStatus,
} from "../../generated/prisma/client";
import { toOutputFormat } from "./to-output-format";

const VEHICLE_COMPLETION_LOCK_PREFIX = "vehicle-processing-completion:";

interface ProcessingCompletionEmailCandidate {
  batchIdempotencyKey: string | null;
  recipient: string | null;
  userId: string;
  vehicleName: string;
}

const claimableJobSelect = {
  id: true,
  userId: true,
  vehicleId: true,
  imageAssetId: true,
  status: true,
  provider: true,
  options: true,
  attemptCount: true,
  maxAttempts: true,
  claimExpiresAt: true,
  imageAsset: {
    select: {
      checksumSha256: true,
      mimeType: true,
      originalObjectKey: true,
      sizeBytes: true,
    },
  },
} satisfies Prisma.ProcessingJobSelect;

const activeJobStatuses = [
  ProcessingJobStatus.CREATED,
  ProcessingJobStatus.QUEUED,
  ProcessingJobStatus.PROCESSING,
  ProcessingJobStatus.RETRYING,
];

const failedJobStatuses = [
  ProcessingJobStatus.FAILED,
  ProcessingJobStatus.CANCELLED,
];

export class PrismaProcessingWorkerRepository
  implements ProcessingWorkerRepositoryPort
{
  public constructor(private readonly database: PrismaClient) {}

  public claimJob(
    input: ClaimProcessingJobInput,
  ): Promise<ClaimProcessingJobResult> {
    return this.database.$transaction(async (transaction) => {
      const job = await transaction.processingJob.findUnique({
        where: { id: input.jobId },
        select: claimableJobSelect,
      });
      if (!job) return { kind: "NOT_FOUND" };
      if (
        job.status === ProcessingJobStatus.COMPLETED ||
        job.status === ProcessingJobStatus.FAILED ||
        job.status === ProcessingJobStatus.CANCELLED
      ) {
        return { kind: "TERMINAL" };
      }

      // The dispatcher sends a message before recording its job as queued,
      // so a fast worker can see the job a moment early.
      if (job.status === ProcessingJobStatus.CREATED) {
        return { kind: "AWAITING_PUBLICATION" };
      }

      const expiredProcessingClaim =
        job.status === ProcessingJobStatus.PROCESSING &&
        job.claimExpiresAt !== null &&
        job.claimExpiresAt <= input.now;
      if (
        job.status !== ProcessingJobStatus.QUEUED &&
        !expiredProcessingClaim
      ) {
        return { kind: "NOT_READY" };
      }

      if (expiredProcessingClaim && job.attemptCount >= job.maxAttempts) {
        await transaction.processingAttempt.updateMany({
          where: {
            jobId: job.id,
            attemptNumber: job.attemptCount,
            status: {
              in: [
                ProcessingAttemptStatus.CLAIMED,
                ProcessingAttemptStatus.STARTED,
              ],
            },
          },
          data: {
            errorCode: PROCESSING_FAILURE_CODES.INTERNAL,
            errorMessage:
              "The worker claim expired after the retry budget was exhausted.",
            finishedAt: input.now,
            retryable: false,
            status: ProcessingAttemptStatus.FAILED,
          },
        });
        await transaction.processingJob.update({
          where: { id: job.id },
          data: {
            claimedAt: null,
            claimExpiresAt: null,
            errorCode: PROCESSING_FAILURE_CODES.INTERNAL,
            errorMessage:
              "Processing stopped after the retry budget was exhausted.",
            failedAt: input.now,
            status: ProcessingJobStatus.FAILED,
            workerId: null,
          },
        });
        await this.updateVehicleStatus(transaction, job.vehicleId);
        return { kind: "TERMINAL" };
      }

      const claimed = await transaction.processingJob.updateMany({
        where: {
          id: job.id,
          ...(expiredProcessingClaim
            ? {
                status: ProcessingJobStatus.PROCESSING,
                claimExpiresAt: { lte: input.now },
              }
            : { status: ProcessingJobStatus.QUEUED }),
        },
        data: {
          attemptCount: { increment: 1 },
          claimedAt: input.now,
          claimExpiresAt: input.claimExpiresAt,
          nextAttemptAt: null,
          startedAt: input.now,
          status: ProcessingJobStatus.PROCESSING,
          workerId: input.workerId,
        },
      });
      if (claimed.count !== 1) return { kind: "NOT_READY" };

      if (expiredProcessingClaim) {
        await transaction.processingAttempt.updateMany({
          where: {
            jobId: job.id,
            attemptNumber: job.attemptCount,
            status: {
              in: [
                ProcessingAttemptStatus.CLAIMED,
                ProcessingAttemptStatus.STARTED,
              ],
            },
          },
          data: {
            errorCode: PROCESSING_FAILURE_CODES.INTERNAL,
            errorMessage: "The previous worker claim expired.",
            finishedAt: input.now,
            retryable: true,
            status: ProcessingAttemptStatus.FAILED,
          },
        });
      }

      const attemptNumber = job.attemptCount + 1;
      await transaction.processingAttempt.create({
        data: {
          attemptNumber,
          jobId: job.id,
          provider: job.provider,
          startedAt: input.now,
          status: ProcessingAttemptStatus.STARTED,
        },
      });

      return {
        kind: "CLAIMED",
        job: {
          attemptNumber,
          checksumSha256: job.imageAsset.checksumSha256,
          id: job.id,
          imageAssetId: job.imageAssetId,
          mimeType: job.imageAsset.mimeType,
          options: ProcessingOptionsSchema.parse(job.options),
          originalObjectKey: job.imageAsset.originalObjectKey,
          provider: job.provider,
          sizeBytes: job.imageAsset.sizeBytes,
          userId: job.userId,
          vehicleId: job.vehicleId,
        },
      };
    });
  }

  public completeJob(
    input: CompleteProcessingJobInput,
  ): Promise<CompleteProcessingJobResult> {
    return this.database.$transaction(async (transaction) => {
      const job = await transaction.processingJob.findUnique({
        where: { id: input.jobId },
        select: {
          id: true,
          batchIdempotencyKey: true,
          userId: true,
          vehicleId: true,
          status: true,
          workerId: true,
          processedAsset: { select: { id: true } },
          user: { select: { primaryEmail: true } },
          vehicle: { select: { name: true } },
        },
      });
      if (!job) return { kind: "NOT_FOUND" };
      if (
        job.status === ProcessingJobStatus.COMPLETED &&
        job.processedAsset
      ) {
        return {
          kind: "ALREADY_COMPLETED",
          processedAssetId: job.processedAsset.id,
        };
      }
      if (
        job.status !== ProcessingJobStatus.PROCESSING ||
        job.workerId !== input.workerId
      ) {
        return { kind: "CLAIM_LOST" };
      }

      const processedAsset = await transaction.processedAsset.create({
        data: {
          checksumSha256: input.output.checksumSha256,
          height: input.output.height,
          jobId: job.id,
          mimeType: input.output.mimeType,
          objectKey: input.output.objectKey,
          outputFormat: toOutputFormat(input.output.outputFormat),
          previewObjectKey: input.output.previewObjectKey,
          sizeBytes: input.output.sizeBytes,
          userId: job.userId,
          vehicleId: job.vehicleId,
          width: input.output.width,
        },
        select: { id: true },
      });
      await transaction.usageEvent.create({
        data: {
          billingPeriodKey: input.usageBillingPeriodKey,
          idempotencyKey: input.usageIdempotencyKey,
          jobId: job.id,
          occurredAt: input.completedAt,
          quantity: 1,
          type: UsageEventType.BACKGROUND_REMOVAL_COMPLETED,
          userId: job.userId,
        },
      });
      await transaction.processingAttempt.updateMany({
        where: {
          attemptNumber: input.attemptNumber,
          jobId: job.id,
          status: ProcessingAttemptStatus.STARTED,
        },
        data: {
          finishedAt: input.completedAt,
          providerLatencyMs: input.providerLatencyMilliseconds,
          providerRequestId: input.providerRequestId,
          retryable: false,
          status: ProcessingAttemptStatus.SUCCEEDED,
        },
      });
      await transaction.processingJob.update({
        where: { id: job.id },
        data: {
          claimedAt: null,
          claimExpiresAt: null,
          completedAt: input.completedAt,
          errorCode: null,
          errorMessage: null,
          nextAttemptAt: null,
          providerRequestId: input.providerRequestId,
          status: ProcessingJobStatus.COMPLETED,
          workerId: null,
        },
      });
      await this.updateVehicleStatus(transaction, job.vehicleId, {
        batchIdempotencyKey: job.batchIdempotencyKey,
        recipient: job.user.primaryEmail,
        userId: job.userId,
        vehicleName: job.vehicle.name,
      });
      return { kind: "COMPLETED", processedAssetId: processedAsset.id };
    });
  }

  public failJob(
    input: FailProcessingJobInput,
  ): Promise<FailProcessingJobResult> {
    return this.database.$transaction(async (transaction) => {
      const job = await transaction.processingJob.findUnique({
        where: { id: input.jobId },
        select: {
          attemptCount: true,
          id: true,
          imageAssetId: true,
          maxAttempts: true,
          status: true,
          vehicleId: true,
          workerId: true,
        },
      });
      if (!job) return { kind: "NOT_FOUND" };
      if (
        job.status !== ProcessingJobStatus.PROCESSING ||
        job.workerId !== input.workerId
      ) {
        return { kind: "CLAIM_LOST" };
      }

      const retryable = input.retryable && job.attemptCount < job.maxAttempts;
      await transaction.processingAttempt.updateMany({
        where: {
          attemptNumber: input.attemptNumber,
          jobId: job.id,
          status: ProcessingAttemptStatus.STARTED,
        },
        data: {
          errorCode: input.errorCode,
          errorMessage: input.errorMessage,
          finishedAt: input.failedAt,
          providerLatencyMs: input.providerLatencyMilliseconds,
          providerRequestId: input.providerRequestId,
          retryable,
          status: ProcessingAttemptStatus.FAILED,
        },
      });

      if (retryable) {
        await transaction.processingJob.update({
          where: { id: job.id },
          data: {
            claimedAt: null,
            claimExpiresAt: null,
            errorCode: input.errorCode,
            errorMessage: input.errorMessage,
            nextAttemptAt: input.nextAttemptAt,
            providerRequestId: input.providerRequestId,
            status: ProcessingJobStatus.RETRYING,
            workerId: null,
          },
        });
        await transaction.processingOutboxMessage.update({
          where: { jobId: job.id },
          data: {
            attemptCount: 0,
            claimedAt: null,
            claimExpiresAt: null,
            claimToken: null,
            lastErrorCode: input.errorCode,
            nextAttemptAt: input.nextAttemptAt,
            publishedAt: null,
            queueMessageId: null,
          },
        });
        return { kind: "RETRY_SCHEDULED", nextAttemptAt: input.nextAttemptAt };
      }

      await transaction.processingJob.update({
        where: { id: job.id },
        data: {
          claimedAt: null,
          claimExpiresAt: null,
          errorCode: input.errorCode,
          errorMessage: input.errorMessage,
          failedAt: input.failedAt,
          nextAttemptAt: null,
          providerRequestId: input.providerRequestId,
          status: ProcessingJobStatus.FAILED,
          workerId: null,
        },
      });
      if (
        input.errorCode === PROCESSING_FAILURE_CODES.INVALID_IMAGE ||
        input.errorCode === PROCESSING_FAILURE_CODES.UNSUPPORTED_FORMAT
      ) {
        await transaction.imageAsset.update({
          where: { id: job.imageAssetId },
          data: {
            invalidReason: input.errorMessage,
            status: ImageAssetStatus.INVALID,
          },
        });
      }
      await this.updateVehicleStatus(transaction, job.vehicleId);
      return { kind: "FAILED" };
    });
  }

  private async updateVehicleStatus(
    transaction: Prisma.TransactionClient,
    vehicleId: string,
    emailCandidate?: ProcessingCompletionEmailCandidate,
  ): Promise<void> {
    await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${VEHICLE_COMPLETION_LOCK_PREFIX}${vehicleId}`}, 0))`;
    const activeCount = await transaction.processingJob.count({
      where: { vehicleId, status: { in: activeJobStatuses } },
    });
    if (activeCount > 0) return;
    const failedCount = await transaction.processingJob.count({
      where: { vehicleId, status: { in: failedJobStatuses } },
    });
    const transition = await transaction.vehicle.updateMany({
      where: { id: vehicleId, status: VehicleStatus.PROCESSING },
      data: {
        status:
          failedCount > 0
            ? VehicleStatus.PARTIALLY_FAILED
            : VehicleStatus.READY,
      },
    });
    if (
      transition.count !== 1 ||
      failedCount > 0 ||
      !emailCandidate?.batchIdempotencyKey ||
      !emailCandidate.recipient
    ) {
      return;
    }
    await transaction.emailOutboxMessage.create({
      data: {
        batchIdempotencyKey: emailCandidate.batchIdempotencyKey,
        recipient: emailCandidate.recipient,
        type: EmailMessageType.PROCESSING_COMPLETED,
        userId: emailCandidate.userId,
        vehicleId,
        vehicleName: emailCandidate.vehicleName,
      },
    });
  }
}
