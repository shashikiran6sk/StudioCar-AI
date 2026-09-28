"use client";

import { useEffect, useRef } from "react";

/**
 * Re-renders the server-drawn page once a tracked group has settled.
 *
 * Inventory cards, dashboard counts and the sidebar allowance are rendered on
 * the server, so polling alone updated only this indicator: a batch could
 * finish while its card still said 0%. Refreshing on every completion would
 * redraw the page once per image, so the authoritative reconciliation waits
 * until the tracked work reaches zero.
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
    if (previous.current > 0 && activeCount === 0) refresh();
    previous.current = activeCount;
  }, [activeCount, refresh]);
}
