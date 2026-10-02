import type { PerformanceStage } from "./performance-stages.constants";
import type { OperationalCorrelation } from "./operational-telemetry.types";

export type MonitoringContext = {
  [Key in keyof OperationalCorrelation]?:
    | OperationalCorrelation[Key]
    | undefined;
} & {
  timings?: Partial<Record<PerformanceStage, { durationMs: number; count: number }>>;
  environment?: string;
  route?: string;
  method?: string;
  errorCode?: string | undefined;
};
export interface StructuredLogFields extends MonitoringContext {
  requestStartedAtUnixMs?: number;
  durationMs?: number | undefined;
  statusCode?: number | undefined;
  errorCode?: string | undefined;
  errorMessage?: string | undefined;
  error?: unknown;
  provider?: string | undefined;
  outcome?: string | undefined;
  creditsCharged?: number | undefined;
  sizeBytes?: number | undefined;
  providerGenerationId?: string | undefined;
  /**
   * Where a provider response failed validation: a field path such as
   * `results.0`, never a value. Logged only when it is a safe identifier.
   */
  responseIssuePath?: string | undefined;
  /** How it failed, as a validator issue code such as `invalid_type`. */
  responseIssueCode?: string | undefined;
  size?: string | undefined;
  format?: string | undefined;
  width?: number | undefined;
  height?: number | undefined;
  attempt?: number | undefined;
  cost?: { amount: string | number; unit: "CREDITS" | "DOLLARS" } | undefined;
}
export interface SafeError {
  name: string;
  code?: string;
  message: string;
  stack?: string;
  causes: { name: string; code?: string }[];
}
