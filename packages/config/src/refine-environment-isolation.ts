import type {
  EnvironmentIssueSink,
  IsolationSubject,
} from "./environment-isolation.types";
import { refineDatabaseIsolation } from "./refine-database-isolation";
import { refineLocalSecretIsolation } from "./refine-local-secret-isolation";
import { refineQueueIsolation } from "./refine-queue-isolation";
import { refineStorageIsolation } from "./refine-storage-isolation";

/**
 * Every runtime schema applies this. Each rule inspects only the settings that
 * runtime owns, so one process's isolation never depends on another's
 * credentials.
 */
export function refineEnvironmentIsolation(
  value: IsolationSubject,
  context: EnvironmentIssueSink,
): void {
  refineDatabaseIsolation(value, context);
  refineStorageIsolation(value, context);
  refineQueueIsolation(value, context);
  refineLocalSecretIsolation(value, context);
}
