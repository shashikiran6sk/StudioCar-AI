import { CloudWatchClient } from "@aws-sdk/client-cloudwatch";
import { parseObservabilityEnvironment } from "@studiocar/config";
import { CloudWatchHttpMetrics } from "./cloudwatch-http-metrics";

export function createCloudWatchHttpMetrics(
  values: Record<string, string | undefined>,
): CloudWatchHttpMetrics | undefined {
  const environment = parseObservabilityEnvironment(values);
  if (environment.HTTP_CLOUDWATCH_METRICS_ENABLED !== "true") return;
  if (!environment.AWS_REGION) return;
  const client = new CloudWatchClient({
    region: environment.AWS_REGION,
    maxAttempts: 1,
  });
  return new CloudWatchHttpMetrics((command, abortSignal) =>
    client.send(command, { abortSignal }),
  );
}
