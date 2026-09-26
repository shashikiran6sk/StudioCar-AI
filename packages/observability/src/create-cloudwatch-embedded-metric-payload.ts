import {
  OPERATIONAL_METRIC_NAMESPACE,
  OPERATIONAL_SERVICE_DIMENSION,
} from "./operational-telemetry.constants";
import type {
  CloudWatchMetricDefinition,
  OperationalEvent,
} from "./operational-telemetry.types";

export function createCloudWatchEmbeddedMetricPayload(
  event: OperationalEvent,
): Record<string, unknown> {
  const dimensions: Record<string, string> = {
    [OPERATIONAL_SERVICE_DIMENSION]: event.service,
  };
  for (const [name, value] of Object.entries(event.dimensions ?? {})) {
    if (name !== OPERATIONAL_SERVICE_DIMENSION) dimensions[name] = value;
  }
  const dimensionNames = Object.keys(dimensions);
  const dimensionSets =
    dimensionNames.length === 1
      ? [dimensionNames]
      : [[OPERATIONAL_SERVICE_DIMENSION], dimensionNames];
  const metricDefinitions: CloudWatchMetricDefinition[] = event.metrics.map(
    (metric) => ({ Name: metric.name, Unit: metric.unit }),
  );
  const payload: Record<string, unknown> = {
    _aws: {
      CloudWatchMetrics: [
        {
          Dimensions: dimensionSets,
          Metrics: metricDefinitions,
          Namespace: OPERATIONAL_METRIC_NAMESPACE,
        },
      ],
      Timestamp: event.timestampMilliseconds,
    },
    correlation: event.correlation ?? {},
    ...(event.error ? { error: event.error } : {}),
    event: event.eventName,
    eventName: event.eventName,
    level: event.level,
    ...dimensions,
  };

  for (const metric of event.metrics) payload[metric.name] = metric.value;
  return payload;
}
