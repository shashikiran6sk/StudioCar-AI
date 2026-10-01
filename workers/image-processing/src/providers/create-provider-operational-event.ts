import {
  monitoringContext,
  OperationalLogLevel,
  OperationalMetricUnit,
  WORKER_SERVICE,
  type OperationalEvent,
  type OperationalMetric,
} from "@studiocar/observability";

import { LEONARDO_PROVIDER_NAME } from "./leonardo-provider.constants";
import type { ProviderExchangeObservation } from "./provider-exchange.types";
import {
  PROVIDER_DIMENSION,
  PROVIDER_EXCHANGE_EVENT,
  PROVIDER_FAILURE_METRICS,
  PROVIDER_METRICS,
} from "./provider-telemetry.constants";

/**
 * One EMF event per provider exchange: request, outcome, latency, the broad
 * failure category and any cost the provider reported. Correlation IDs stay in
 * the log body; the only dimensions are the service and the provider name.
 */
export function createProviderOperationalEvent(
  observation: ProviderExchangeObservation,
): OperationalEvent {
  const count = (name: string): OperationalMetric => ({
    name,
    unit: OperationalMetricUnit.COUNT,
    value: 1,
  });
  const metrics: OperationalMetric[] = [
    count(PROVIDER_METRICS.request),
    count(
      observation.failureCategory === null
        ? PROVIDER_METRICS.success
        : PROVIDER_METRICS.failure,
    ),
    {
      name: PROVIDER_METRICS.duration,
      unit: OperationalMetricUnit.MILLISECONDS,
      value: Math.max(0, observation.durationMilliseconds),
    },
  ];
  if (observation.failureCategory !== null) {
    metrics.push(count(PROVIDER_FAILURE_METRICS[observation.failureCategory]));
  }
  const costAmount = Number(observation.cost?.amount);
  if (observation.cost && Number.isFinite(costAmount) && costAmount >= 0) {
    metrics.push({
      name:
        observation.cost.unit === "CREDITS"
          ? PROVIDER_METRICS.costCredits
          : PROVIDER_METRICS.costDollars,
      unit: OperationalMetricUnit.NONE,
      value: costAmount,
    });
  }
  const context = monitoringContext.getStore();
  return {
    correlation: {
      ...(context?.requestId ? { requestId: context.requestId } : {}),
      ...(context?.batchId ? { batchId: context.batchId } : {}),
      ...(context?.jobId ? { jobId: context.jobId } : {}),
      ...(context?.queueMessageId
        ? { queueMessageId: context.queueMessageId }
        : {}),
    },
    dimensions: { [PROVIDER_DIMENSION]: LEONARDO_PROVIDER_NAME },
    eventName: PROVIDER_EXCHANGE_EVENT,
    level:
      observation.failureCategory === null
        ? OperationalLogLevel.INFO
        : OperationalLogLevel.WARN,
    metrics,
    service: WORKER_SERVICE,
    timestampMilliseconds: observation.finishedAtMilliseconds,
  };
}
