import { parseLifecycleCleanupEnvironment } from "@studiocar/config";
import {
  createDatabaseClient,
  PrismaLifecycleCleanupRepository,
} from "@studiocar/database";

import {
  MILLISECONDS_PER_DAY,
  MILLISECONDS_PER_HOUR,
} from "./lifecycle-cleanup.constants";
import { LifecycleCleanupService } from "./lifecycle-cleanup-service";

export interface LifecycleCleanupRuntime {
  cleanupToken: string;
  service: LifecycleCleanupService;
}

let lifecycleCleanupRuntime: LifecycleCleanupRuntime | undefined;

export function getLifecycleCleanupRuntime(): LifecycleCleanupRuntime {
  if (lifecycleCleanupRuntime) return lifecycleCleanupRuntime;

  const environment = parseLifecycleCleanupEnvironment(process.env);
  const database = createDatabaseClient({
    connectionString: environment.DATABASE_URL,
  });
  lifecycleCleanupRuntime = {
    cleanupToken: environment.LIFECYCLE_CLEANUP_TOKEN,
    service: new LifecycleCleanupService(
      new PrismaLifecycleCleanupRepository(database),
      {
        batchSize: environment.LIFECYCLE_CLEANUP_BATCH_SIZE,
        sessionRetentionMilliseconds:
          environment.SESSION_RETENTION_DAYS * MILLISECONDS_PER_DAY,
        authChallengeRetentionMilliseconds:
          environment.AUTH_CHALLENGE_RETENTION_DAYS * MILLISECONDS_PER_DAY,
        commandRateLimitRetentionMilliseconds:
          environment.COMMAND_RATE_LIMIT_RETENTION_HOURS *
          MILLISECONDS_PER_HOUR,
      },
    ),
  };
  return lifecycleCleanupRuntime;
}
