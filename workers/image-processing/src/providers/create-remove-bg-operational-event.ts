import {
  monitoringContext,
  OperationalLogLevel,
  OperationalMetricUnit,
  WORKER_SERVICE,
  type OperationalEvent,
  type OperationalMetric,
} from "@studiocar/observability";
import {
  REMOVE_BG_METRICS,
  REMOVE_BG_MONITORED_STATUSES,
} from "./remove-bg-telemetry.constants";

export interface RemoveBgObservation {
  phase: "started" | "finished";
  success?: boolean;
  statusCode?: number | undefined;
  durationMs?: number | undefined;
  creditsCharged?: number | undefined;
}

export function createRemoveBgOperationalEvent(
  observation: RemoveBgObservation,
): OperationalEvent {
  const metrics: OperationalMetric[] = [];
  const count = (name: string) => {
    metrics.push({ name, unit: OperationalMetricUnit.COUNT, value: 1 });
  };
  if (observation.phase === "started") count(REMOVE_BG_METRICS.request);
  else {
    count(
      observation.success
        ? REMOVE_BG_METRICS.success
        : REMOVE_BG_METRICS.failure,
    );
    metrics.push({
      name: REMOVE_BG_METRICS.duration,
      unit: OperationalMetricUnit.MILLISECONDS,
      value: Math.max(0, observation.durationMs ?? 0),
    });
    if (observation.statusCode !== undefined) {
      if (REMOVE_BG_MONITORED_STATUSES.includes(observation.statusCode))
        count(`removebg.status.${String(observation.statusCode)}`);
      if (observation.statusCode >= 400 && observation.statusCode < 500)
        count(REMOVE_BG_METRICS.clientError);
      if (observation.statusCode >= 500) count(REMOVE_BG_METRICS.serverError);
    }
    if (observation.creditsCharged !== undefined) {
      metrics.push({
        name: REMOVE_BG_METRICS.credits,
        unit: OperationalMetricUnit.COUNT,
        value: observation.creditsCharged,
      });
    } else if (observation.success) count(REMOVE_BG_METRICS.unreportedCredits);
  }
  const context = monitoringContext.getStore();
  return {
    eventName:
      observation.phase === "started"
        ? "remove_bg_request_metrics"
        : "remove_bg_result_metrics",
    level:
      observation.phase === "started" || observation.success
        ? OperationalLogLevel.INFO
        : OperationalLogLevel.WARN,
    service: WORKER_SERVICE,
    dimensions: { Provider: "remove.bg" },
    correlation: {
      ...(context?.requestId ? { requestId: context.requestId } : {}),
      ...(context?.batchId ? { batchId: context.batchId } : {}),
      ...(context?.jobId ? { jobId: context.jobId } : {}),
      ...(context?.queueMessageId
        ? { queueMessageId: context.queueMessageId }
        : {}),
    },
    timestampMilliseconds: Date.now(),
    metrics,
  };
}
