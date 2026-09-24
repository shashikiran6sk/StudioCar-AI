export const OPERATIONAL_METRIC_NAMESPACE = "StudioCarAI/Operations";
export const OPERATIONAL_SERVICE_DIMENSION = "Service";

export const OPERATIONAL_ERROR_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9]{0,79}$/;
export const OPERATIONAL_ERROR_CODE_PATTERN = /^[A-Z][A-Z0-9_]{0,39}$/;
export const OPERATIONAL_ERROR_MAXIMUM_CAUSE_DEPTH = 5;
export const UNKNOWN_OPERATIONAL_ERROR_NAME = "UnknownError";

export enum OperationalLogLevel {
  INFO = "INFO",
  WARN = "WARN",
}

export enum OperationalMetricUnit {
  BYTES = "Bytes",
  COUNT = "Count",
  MILLISECONDS = "Milliseconds",
}
