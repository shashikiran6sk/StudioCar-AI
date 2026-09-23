"use client";

import { useEffect, useRef } from "react";

/**
 * Re-renders the server-drawn page whenever a tracked job finishes.
 *
 * Inventory cards, dashboard counts and the sidebar allowance are rendered on
 * the server, so polling alone updated only this indicator: a batch could
 * finish while its card still said 0%. A drop in the number of running jobs
 * means one reached a final state, and that is when the page is stale.
 *
 * Nothing happens on the first render or when jobs are added, so opening a
 * page never triggers a second, redundant render.
 */
export function useRefreshWhenJobsSettle(
  activeCount: number,
  refresh: () => void,
): void {
  const previous = useRef(activeCount);

  useEffect(() => {
    if (activeCount < previous.current) refresh();
    previous.current = activeCount;
  }, [activeCount, refresh]);
}
