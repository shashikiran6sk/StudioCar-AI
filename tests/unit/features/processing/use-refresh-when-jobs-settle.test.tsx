import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useRefreshWhenJobsSettle } from "../../../../apps/web/src/features/processing/use-refresh-when-jobs-settle";

describe("useRefreshWhenJobsSettle", () => {
  it("does not refresh when a page first opens", () => {
    const refresh = vi.fn();
    renderHook(() => useRefreshWhenJobsSettle(3, refresh));

    expect(refresh).not.toHaveBeenCalled();
  });

  it("refreshes each time a running job reaches a final state", () => {
    const refresh = vi.fn();
    const { rerender } = renderHook(
      ({ active }) => useRefreshWhenJobsSettle(active, refresh),
      { initialProps: { active: 3 } },
    );

    // A three-photo batch: the card should move 33% → 67% → 100%.
    rerender({ active: 2 });
    rerender({ active: 1 });
    rerender({ active: 0 });

    expect(refresh).toHaveBeenCalledTimes(3);
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
