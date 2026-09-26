import {
  OPERATIONAL_METRIC_NAMESPACE,
  OPERATIONAL_SERVICE_DIMENSION,
} from "./operational-telemetry.constants";
import { LOG_EVENTS } from "./monitoring.constants";
import { PutMetricDataCommand } from "@aws-sdk/client-cloudwatch";
import { HTTP_SERVICE, METRIC_TIMEOUT_MS } from "./monitoring.constants";
import type { OperationalMetric } from "./operational-telemetry.types";
import { logger } from "./structured-logger";

export class CloudWatchHttpMetrics {
  public constructor(
    private readonly send: (
      command: PutMetricDataCommand,
      signal: AbortSignal,
    ) => Promise<unknown>,
  ) {}

  public async record(metrics: readonly OperationalMetric[]): Promise<void> {
    try {
      await this.send(
        new PutMetricDataCommand({
          Namespace: OPERATIONAL_METRIC_NAMESPACE,
          MetricData: metrics.map((metric) => ({
            MetricName: metric.name,
            Unit: metric.unit,
            Value: metric.value,
            Dimensions: [
              { Name: OPERATIONAL_SERVICE_DIMENSION, Value: HTTP_SERVICE },
            ],
          })),
        }),
        AbortSignal.timeout(METRIC_TIMEOUT_MS),
      );
    } catch {
      logger.log("warn", LOG_EVENTS.HTTP_METRICS_FAILED);
    }
  }
}
