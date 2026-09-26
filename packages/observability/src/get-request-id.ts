import { randomUUID } from "node:crypto";
import { monitoringContext } from "./monitoring-context";

export function getRequestId(): string {
  return monitoringContext.getStore()?.requestId ?? randomUUID();
}
