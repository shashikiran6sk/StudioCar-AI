import type { WorkerMessage } from "@studiocar/contracts";
import {
  OperationalLogLevel,
  OperationalMetricUnit,
  type OperationalErrorClass,
  type OperationalEvent,
  type OperationalMetric,
} from "@studiocar/observability";
import type { ProcessWorkerMessageResult } from "@studiocar/processing";

import {
  IMAGE_PROCESSING_SERVICE,
  IMAGES_PROCESSED_METRIC,
  PROCESSING_DURATION_METRIC,
  PROCESSING_END_TO_END_LATENCY_METRIC,
  PROCESSING_EVENT_NAME,
  PROCESSING_IGNORED_METRIC,
  PROCESSING_MESSAGE_COUNT_METRIC,
  PROCESSING_OUTCOME_DIMENSION,
  PROCESSING_PROVIDER_DIMENSION,
  PROCESSING_PROVIDER_LATENCY_METRIC,
  PROCESSING_PROVIDER_RATE_LIMIT_METRIC,
  PROCESSING_RETRY_METRIC,
  PROCESSING_TERMINAL_FAILURE_METRIC,
  UNEXPECTED_PROCESSING_OUTCOME,
  UNKNOWN_PROCESSING_PROVIDER,
} from "./processing-telemetry.constants";

export interface CreateProcessingOperationalEventInput {
  error?: OperationalErrorClass;
  finishedAtMilliseconds: number;
  message?: WorkerMessage;
  queueMessageId: string;
  result?: ProcessWorkerMessageResult;
  startedAtMilliseconds: number;
}

export function createProcessingOperationalEvent(
  input: CreateProcessingOperationalEventInput,
): OperationalEvent {
  const outcome = input.result?.kind ?? UNEXPECTED_PROCESSING_OUTCOME;
  const provider =
    input.result?.telemetry?.provider ?? UNKNOWN_PROCESSING_PROVIDER;
  const metrics: OperationalMetric[] = [
    {
      name: PROCESSING_MESSAGE_COUNT_METRIC,
      unit: OperationalMetricUnit.COUNT,
      value: 1,
    },
    {
      name: PROCESSING_DURATION_METRIC,
      unit: OperationalMetricUnit.MILLISECONDS,
      value: Math.max(
        0,
        input.finishedAtMilliseconds - input.startedAtMilliseconds,
      ),
    },
  ];
  if (input.message) {
    metrics.push({
      name: PROCESSING_END_TO_END_LATENCY_METRIC,
      unit: OperationalMetricUnit.MILLISECONDS,
      value: Math.max(
        0,
        input.finishedAtMilliseconds - Date.parse(input.message.enqueuedAt),
      ),
    });
  }
  const providerLatency =
    input.result?.telemetry?.providerLatencyMilliseconds;
  if (providerLatency !== null && providerLatency !== undefined) {
    metrics.push({
      name: PROCESSING_PROVIDER_LATENCY_METRIC,
      unit: OperationalMetricUnit.MILLISECONDS,
      value: providerLatency,
    });
  }
  if (outcome === "COMPLETED") {
    metrics.push({
      name: IMAGES_PROCESSED_METRIC,
      unit: OperationalMetricUnit.COUNT,
      value: 1,
    });
  } else if (outcome === "FAILED") {
    metrics.push({
      name: PROCESSING_TERMINAL_FAILURE_METRIC,
      unit: OperationalMetricUnit.COUNT,
      value: 1,
    });
  } else if (
    outcome === "RETRY_SCHEDULED" ||
    outcome === "RETRY_DELIVERY" ||
    outcome === UNEXPECTED_PROCESSING_OUTCOME
  ) {
    metrics.push({
      name: PROCESSING_RETRY_METRIC,
      unit: OperationalMetricUnit.COUNT,
      value: 1,
    });
  } else {
    metrics.push({
      name: PROCESSING_IGNORED_METRIC,
      unit: OperationalMetricUnit.COUNT,
      value: 1,
    });
  }
  if (input.result?.telemetry?.failureKind === "PROVIDER_429") {
    metrics.push({
      name: PROCESSING_PROVIDER_RATE_LIMIT_METRIC,
      unit: OperationalMetricUnit.COUNT,
      value: 1,
    });
  }

  return {
    correlation: {
      ...(input.result?.telemetry
        ? {
            assetId: input.result.telemetry.assetId,
            ...(input.result.telemetry.providerRequestId
              ? {
                  providerRequestId:
                    input.result.telemetry.providerRequestId,
                }
              : {}),
            userId: input.result.telemetry.userId,
            vehicleId: input.result.telemetry.vehicleId,
          }
        : {}),
      ...(input.message ? { jobId: input.message.jobId } : {}),
      queueMessageId: input.queueMessageId,
    },
    dimensions: {
      [PROCESSING_OUTCOME_DIMENSION]: outcome,
      [PROCESSING_PROVIDER_DIMENSION]: provider,
    },
    ...(input.error ? { error: input.error } : {}),
    eventName: PROCESSING_EVENT_NAME,
    level:
      outcome === "COMPLETED" || outcome === "IGNORED"
        ? OperationalLogLevel.INFO
        : OperationalLogLevel.WARN,
    metrics,
    service: IMAGE_PROCESSING_SERVICE,
    timestampMilliseconds: input.finishedAtMilliseconds,
  };
}
