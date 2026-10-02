import type {
  OperationalLogLevel,
  OperationalMetricUnit,
} from "./operational-telemetry.constants";

export interface OperationalCorrelation {
  batchId?: string;
  assetId?: string;
  jobId?: string;
  providerRequestId?: string;
  queueMessageId?: string;
  requestId?: string;
  userId?: string;
  vehicleId?: string;
}

export interface OperationalMetric {
  name: string;
  unit: OperationalMetricUnit;
  value: number;
}

/**
 * A bounded description of an unexpected failure: the error's class name and,
 * when one exists, its machine code (`P1001`, `ENOTFOUND`). Never a message,
 * stack, or payload, which can carry hosts, credentials, or customer data.
 */
export interface OperationalErrorClass {
  code?: string;
  name: string;
}

export interface OperationalEvent {
  correlation?: OperationalCorrelation;
  dimensions?: Readonly<Record<string, string>>;
  error?: OperationalErrorClass;
  eventName: string;
  level: OperationalLogLevel;
  metrics: readonly OperationalMetric[];
  service: string;
  timestampMilliseconds: number;
}

export interface OperationalEventSink {
  write(serializedEvent: string): void;
}

export interface OperationalTelemetryPort {
  emit(event: OperationalEvent): boolean;
}

export interface CloudWatchMetricDefinition {
  Name: string;
  Unit: OperationalMetricUnit;
}

export interface CloudWatchMetricDirective {
  Dimensions: string[][];
  Metrics: CloudWatchMetricDefinition[];
  Namespace: string;
}

export interface CloudWatchEmbeddedMetricMetadata {
  CloudWatchMetrics: CloudWatchMetricDirective[];
  Timestamp: number;
}
