import { monitoringContext } from "./monitoring-context";
import type { PerformanceStage } from "./performance-stages.constants";

/** Accumulates bounded timings in the existing request context, without extra logs. */
export async function measureStage<T>(
  stage: PerformanceStage,
  operation: () => Promise<T>,
): Promise<T> {
  const timings = monitoringContext.getStore()?.timings;
  if (!timings) return operation();
  const start = performance.now();
  try {
    return await operation();
  } finally {
    const elapsed = Math.max(0, performance.now() - start);
    const previous = timings[stage];
    timings[stage] = {
      durationMs: (previous?.durationMs ?? 0) + elapsed,
      count: (previous?.count ?? 0) + 1,
    };
  }
}
