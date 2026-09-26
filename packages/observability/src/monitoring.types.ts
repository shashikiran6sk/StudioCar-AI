import type { OperationalCorrelation } from "./operational-telemetry.types";

export type MonitoringContext = {
  [Key in keyof OperationalCorrelation]?:
    | OperationalCorrelation[Key]
    | undefined;
} & {
  environment?: string;
  route?: string;
  method?: string;
  errorCode?: string | undefined;
};
export interface StructuredLogFields extends MonitoringContext {
  durationMs?: number | undefined;
  statusCode?: number | undefined;
  errorCode?: string | undefined;
  errorMessage?: string | undefined;
  error?: unknown;
  provider?: string | undefined;
  outcome?: string | undefined;
  creditsCharged?: number | undefined;
  sizeBytes?: number | undefined;
}
export interface SafeError {
  name: string;
  code?: string;
  message: string;
  stack?: string;
  causes: { name: string; code?: string }[];
}
