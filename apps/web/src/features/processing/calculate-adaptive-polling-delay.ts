import {
  POLLING_FIRST_DELAY_MS,
  POLLING_FIRST_WINDOW_MS,
  POLLING_LONG_DELAY_MS,
  POLLING_SECOND_DELAY_MS,
  POLLING_SECOND_WINDOW_MS,
  POLLING_THIRD_DELAY_MS,
  POLLING_THIRD_WINDOW_MS,
} from "./processing-polling.constants";

export function calculateAdaptivePollingDelay(
  startedAtMilliseconds: number[],
  nowMilliseconds: number,
): number | null {
  let minimumDelay: number | null = null;
  for (const startedAt of startedAtMilliseconds) {
    const elapsed = Math.max(0, nowMilliseconds - startedAt);
    const delay =
      elapsed < POLLING_FIRST_WINDOW_MS
        ? POLLING_FIRST_DELAY_MS
        : elapsed < POLLING_SECOND_WINDOW_MS
          ? POLLING_SECOND_DELAY_MS
          : elapsed < POLLING_THIRD_WINDOW_MS
            ? POLLING_THIRD_DELAY_MS
            : POLLING_LONG_DELAY_MS;
    minimumDelay = minimumDelay === null ? delay : Math.min(minimumDelay, delay);
  }
  return minimumDelay;
}
