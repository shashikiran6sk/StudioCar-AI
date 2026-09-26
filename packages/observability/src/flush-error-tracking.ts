import { flush } from "@sentry/node";
import { SENTRY_FLUSH_TIMEOUT_MS } from "./monitoring.constants";

export async function flushErrorTracking(): Promise<void> {
  try {
    await flush(SENTRY_FLUSH_TIMEOUT_MS);
  } catch {
    /* Best effort at invocation end. */
  }
}
