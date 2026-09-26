import type { ErrorEvent } from "@sentry/node";
import {
  SAFE_ERROR_MESSAGE,
  SAFE_IDENTIFIER_PATTERN,
  SAFE_ROUTE_PATTERN,
} from "./monitoring.constants";

const TAGS = [
  "requestId",
  "batchId",
  "jobId",
  "errorCode",
  "route",
  "method",
] satisfies readonly string[];
export function sanitizeSentryEvent(event: ErrorEvent): ErrorEvent | null {
  if (!event.exception?.values?.length) return null;
  const tags: Record<string, string> = {};
  for (const key of TAGS) {
    const value = event.tags?.[key];
    if (
      typeof value === "string" &&
      (SAFE_IDENTIFIER_PATTERN.test(value) ||
        (key === "route" && SAFE_ROUTE_PATTERN.test(value)))
    )
      tags[key] = value;
  }
  return {
    type: undefined,
    ...(event.event_id ? { event_id: event.event_id } : {}),
    ...(event.timestamp !== undefined ? { timestamp: event.timestamp } : {}),
    platform: "node",
    level: "error",
    ...(event.environment ? { environment: event.environment } : {}),
    ...(event.release ? { release: event.release } : {}),
    tags,
    exception: {
      values: event.exception.values.map((value) => ({
        type:
          value.type && /^[A-Za-z][A-Za-z0-9]{0,79}$/.test(value.type)
            ? value.type
            : "Error",
        value: SAFE_ERROR_MESSAGE,
        stacktrace: {
          frames: (value.stacktrace?.frames ?? []).map((frame) => ({
            ...(frame.filename &&
            /^[/A-Za-z0-9_.@:-]+\.(?:[cm]?js|tsx?)$/.test(frame.filename)
              ? { filename: frame.filename }
              : {}),
            ...(frame.function &&
            /^[A-Za-z0-9_.$<> ]{1,128}$/.test(frame.function)
              ? { function: frame.function }
              : {}),
            ...(frame.lineno !== undefined ? { lineno: frame.lineno } : {}),
            ...(frame.colno !== undefined ? { colno: frame.colno } : {}),
            ...(frame.in_app !== undefined ? { in_app: frame.in_app } : {}),
          })),
        },
      })),
    },
  };
}
