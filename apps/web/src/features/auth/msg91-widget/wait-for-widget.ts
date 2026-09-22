import {
  MSG91_WIDGET_POLL_INTERVAL_MS,
  MSG91_WIDGET_READY_TIMEOUT_MS,
} from "./msg91-widget.constants";

/**
 * The provider script attaches its methods asynchronously after
 * initialisation, so readiness has to be observed rather than awaited.
 */
export function waitForWidget(
  ready: () => boolean,
  timeoutMs: number = MSG91_WIDGET_READY_TIMEOUT_MS,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (ready()) {
      resolve();
      return;
    }
    const startedAt = Date.now();
    const timer = setInterval(() => {
      if (ready()) {
        clearInterval(timer);
        resolve();
        return;
      }
      if (Date.now() - startedAt >= timeoutMs) {
        clearInterval(timer);
        reject(new Error("timed out"));
      }
    }, MSG91_WIDGET_POLL_INTERVAL_MS);
  });
}
