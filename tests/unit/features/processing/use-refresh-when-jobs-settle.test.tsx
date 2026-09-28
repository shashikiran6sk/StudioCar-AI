import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useRefreshWhenJobsSettle } from "../../../../apps/web/src/features/processing/use-refresh-when-jobs-settle";

describe("useRefreshWhenJobsSettle", () => {
  it("does not refresh when a page first opens", () => {
    const refresh = vi.fn();
    renderHook(() => useRefreshWhenJobsSettle(3, refresh));

    expect(refresh).not.toHaveBeenCalled();
  });

  it("refreshes once after the tracked group reaches a final state", () => {
    const refresh = vi.fn();
    const { rerender } = renderHook(
      ({ active }) => useRefreshWhenJobsSettle(active, refresh),
      { initialProps: { active: 3 } },
    );

    // A three-photo batch is reconciled once all statuses are terminal.
    rerender({ active: 2 });
    rerender({ active: 1 });
    rerender({ active: 0 });

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("does not refresh when new jobs start", () => {
    const refresh = vi.fn();
    const { rerender } = renderHook(
      ({ active }) => useRefreshWhenJobsSettle(active, refresh),
      { initialProps: { active: 0 } },
    );

    rerender({ active: 2 });

    expect(refresh).not.toHaveBeenCalled();
  });
});
