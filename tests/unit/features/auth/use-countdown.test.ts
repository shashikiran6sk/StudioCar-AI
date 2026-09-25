import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useCountdown } from "../../../../apps/web/src/features/auth/use-countdown";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useCountdown", () => {
  it("counts whole seconds down to zero", () => {
    const { result } = renderHook(() => useCountdown());
    expect(result.current[0]).toBe(0);

    act(() => {
      result.current[1](3);
    });
    expect(result.current[0]).toBe(3);

    act(() => {
      vi.advanceTimersByTime(1_000);
    });
    expect(result.current[0]).toBe(2);

    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(result.current[0]).toBe(0);
  });

  it("restarts and cancels", () => {
    const { result } = renderHook(() => useCountdown());

    act(() => {
      result.current[1](10);
    });
    act(() => {
      result.current[1](41);
    });
    expect(result.current[0]).toBe(41);

    act(() => {
      result.current[1](0);
    });
    expect(result.current[0]).toBe(0);
  });
});
