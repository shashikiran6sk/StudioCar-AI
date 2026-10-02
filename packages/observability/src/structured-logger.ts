import { PerformanceStage } from "./performance-stages.constants";
import { parseObservabilityEnvironment } from "@studiocar/config";
import { monitoringContext } from "./monitoring-context";
import {
  HTTP_ERROR_MESSAGES,
  SAFE_ERROR_MESSAGE,
  SAFE_IDENTIFIER_PATTERN,
  SAFE_ROUTE_PATTERN,
} from "./monitoring.constants";
import type { StructuredLogFields } from "./monitoring.types";
import type { OperationalEventSink } from "./operational-telemetry.types";
import { serializeSafeError } from "./serialize-safe-error";

const STRING_FIELDS = [
  "requestId",
  "batchId",
  "jobId",
  "assetId",
  "queueMessageId",
  "providerRequestId",
  "providerGenerationId",
  "responseIssuePath",
  "responseIssueCode",
  "size",
  "format",
  "vehicleId",
  "userId",
  "environment",
  "method",
  "provider",
  "outcome",
  "errorCode",
] satisfies readonly (keyof StructuredLogFields)[];
const NUMBER_FIELDS = [
  "durationMs",
  "requestStartedAtUnixMs",
  "statusCode",
  "creditsCharged",
  "sizeBytes",
  "width",
  "height",
  "attempt",
] satisfies readonly (keyof StructuredLogFields)[];
const STDOUT: OperationalEventSink = {
  write: (line) => {
    process.stdout.write(`${line}\n`);
  },
};

export class StructuredLogger {
  public constructor(private readonly sink: OperationalEventSink = STDOUT) {}

  public log(
    level: "info" | "warn" | "error",
    event: string,
    fields: StructuredLogFields = {},
  ): boolean {
    try {
      const merged = { ...monitoringContext.getStore(), ...fields };
      const payload: Record<string, unknown> = {
        level,
        event,
        timestamp: new Date().toISOString(),
      };
      const environment =
        merged.environment ??
        parseObservabilityEnvironment(process.env).APP_ENV ??
        "unconfigured";
      merged.environment = environment;
      for (const key of STRING_FIELDS) {
        const value = merged[key];
        if (value !== undefined && SAFE_IDENTIFIER_PATTERN.test(value))
          payload[key] = value;
      }
      for (const key of NUMBER_FIELDS) {
        const value = merged[key];
        if (value !== undefined && Number.isFinite(value) && value >= 0)
          payload[key] = value;
      }
      if (
        merged.cost &&
        Number.isFinite(Number(merged.cost.amount)) &&
        Number(merged.cost.amount) >= 0
      ) {
        payload.cost = { amount: merged.cost.amount, unit: merged.cost.unit };
      }
      if (fields.timings) {
        const timings: Record<string, { durationMs: number; count: number }> = {};
        for (const stage of Object.values(PerformanceStage)) {
          const timing = fields.timings[stage];
          if (timing && Number.isFinite(timing.durationMs) && timing.durationMs >= 0 &&
              Number.isSafeInteger(timing.count) && timing.count > 0) {
            timings[stage] = { durationMs: timing.durationMs, count: timing.count };
          }
        }
        payload.timings = timings;
      }
      if (merged.route && SAFE_ROUTE_PATTERN.test(merged.route))
        payload.route = merged.route;
      // Callers provide repository-owned messages; arbitrary error messages are never serialized.
      if (merged.errorCode)
        payload.errorMessage =
          HTTP_ERROR_MESSAGES[merged.errorCode] ?? SAFE_ERROR_MESSAGE;
      if (merged.error !== undefined)
        payload.error = serializeSafeError(merged.error);
      this.sink.write(JSON.stringify(payload));
      return true;
    } catch {
      return false;
    }
  }
}
export const logger = new StructuredLogger();
