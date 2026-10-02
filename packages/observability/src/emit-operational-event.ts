import type {
  OperationalEvent,
  OperationalTelemetryPort,
} from "./operational-telemetry.types";

export function emitOperationalEvent(
  telemetry: OperationalTelemetryPort,
  event: OperationalEvent,
): boolean {
  try {
    return telemetry.emit(event);
  } catch {
    return false;
  }
}
