import { createCloudWatchEmbeddedMetricPayload } from "./create-cloudwatch-embedded-metric-payload";
import type {
  OperationalEvent,
  OperationalEventSink,
  OperationalTelemetryPort,
} from "./operational-telemetry.types";

const STANDARD_OUTPUT_SINK: OperationalEventSink = {
  write(serializedEvent) {
    process.stdout.write(`${serializedEvent}\n`);
  },
};

export class OperationalTelemetry implements OperationalTelemetryPort {
  public constructor(
    private readonly sink: OperationalEventSink = STANDARD_OUTPUT_SINK,
  ) {}

  public emit(event: OperationalEvent): boolean {
    try {
      this.sink.write(
        JSON.stringify(createCloudWatchEmbeddedMetricPayload(event)),
      );
      return true;
    } catch {
      return false;
    }
  }
}
