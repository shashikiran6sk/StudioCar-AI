import { OPERATIONAL_ERROR_MAXIMUM_CAUSE_DEPTH } from "./operational-telemetry.constants";
import { classifyOperationalError } from "./classify-operational-error";
import {
  MAXIMUM_STACK_FRAMES,
  SAFE_ERROR_MESSAGE,
} from "./monitoring.constants";
import type { SafeError } from "./monitoring.types";

export function serializeSafeError(error: unknown): SafeError {
  const classification = classifyOperationalError(error);
  const causes: SafeError["causes"] = [];
  let cause: unknown = error instanceof Error ? error.cause : undefined;
  for (
    let depth = 0;
    depth < OPERATIONAL_ERROR_MAXIMUM_CAUSE_DEPTH && cause instanceof Error;
    depth += 1
  ) {
    causes.push(classifyOperationalError(cause));
    cause = cause.cause;
  }
  // Only V8 code locations survive. Exception messages and URL queries never do.
  const frames =
    error instanceof Error
      ? (error.stack ?? "")
          .split("\n")
          .slice(1)
          .filter((frame) =>
            /^\s+at (?:async )?(?:[A-Za-z0-9_.$<>]+ \()?[/A-Za-z0-9_.@:-]+\.(?:[cm]?js|tsx?):\d+:\d+\)?$/.test(
              frame,
            ),
          )
          .slice(0, MAXIMUM_STACK_FRAMES)
      : [];
  return {
    ...classification,
    message: SAFE_ERROR_MESSAGE,
    ...(frames.length
      ? {
          stack: `${classification.name}: ${SAFE_ERROR_MESSAGE}\n${frames.join("\n")}`,
        }
      : {}),
    causes,
  };
}
