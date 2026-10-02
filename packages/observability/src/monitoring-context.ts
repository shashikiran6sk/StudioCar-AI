import { AsyncLocalStorage } from "node:async_hooks";
import type { MonitoringContext } from "./monitoring.types";

export const monitoringContext = new AsyncLocalStorage<MonitoringContext>();
