import { HTTP_METRICS } from "./monitoring.constants";
import { OperationalMetricUnit } from "./operational-telemetry.constants";
import type { OperationalMetric } from "./operational-telemetry.types";

export function createHttpMetrics(
  statusCode: number,
  durationMs: number,
): OperationalMetric[] {
  const counts = [
    HTTP_METRICS.REQUESTS,
    ...(statusCode >= 200 && statusCode < 300 ? [HTTP_METRICS.SUCCESS] : []),
    ...(statusCode === 401 ? [HTTP_METRICS.UNAUTHORIZED] : []),
    ...(statusCode === 403 ? [HTTP_METRICS.FORBIDDEN] : []),
    ...(statusCode >= 400 && statusCode < 500
      ? [HTTP_METRICS.CLIENT_ERROR]
      : []),
    ...(statusCode >= 500 ? [HTTP_METRICS.SERVER_ERROR] : []),
  ];
  return [
    ...counts.map((name) => ({
      name,
      unit: OperationalMetricUnit.COUNT,
      value: 1,
    })),
    {
      name: HTTP_METRICS.DURATION,
      unit: OperationalMetricUnit.MILLISECONDS,
      value: Math.max(0, durationMs),
    },
  ];
}
