import {
  OPERATIONAL_ERROR_CODE_PATTERN,
  OPERATIONAL_ERROR_MAXIMUM_CAUSE_DEPTH,
  OPERATIONAL_ERROR_NAME_PATTERN,
  UNKNOWN_OPERATIONAL_ERROR_NAME,
} from "./operational-telemetry.constants";
import type { OperationalErrorClass } from "./operational-telemetry.types";

function findErrorCode(error: Error): string | undefined {
  let current: unknown = error;
  for (
    let depth = 0;
    depth <= OPERATIONAL_ERROR_MAXIMUM_CAUSE_DEPTH && current instanceof Error;
    depth += 1
  ) {
    if (
      "code" in current &&
      typeof current.code === "string" &&
      OPERATIONAL_ERROR_CODE_PATTERN.test(current.code)
    ) {
      return current.code;
    }
    current = current.cause;
  }
  return undefined;
}

/**
 * Reduces a caught value to identifiers safe to log: its class name and the
 * first machine code in its cause chain. Anything that does not match the
 * bounded identifier patterns is dropped rather than truncated.
 */
export function classifyOperationalError(
  error: unknown,
): OperationalErrorClass {
  if (!(error instanceof Error)) {
    return { name: UNKNOWN_OPERATIONAL_ERROR_NAME };
  }
  const name = OPERATIONAL_ERROR_NAME_PATTERN.test(error.name)
    ? error.name
    : UNKNOWN_OPERATIONAL_ERROR_NAME;
  const code = findErrorCode(error);
  return code === undefined ? { name } : { code, name };
}
