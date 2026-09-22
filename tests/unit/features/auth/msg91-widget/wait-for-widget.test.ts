import { describe, expect, it, vi } from "vitest";

import { waitForWidget } from "../../../../../apps/web/src/features/auth/msg91-widget/wait-for-widget";

describe("waitForWidget", () => {
  it("resolves immediately when the condition already holds", async () => {
    await expect(waitForWidget(() => true)).resolves.toBeUndefined();
  });

  it("resolves once the condition becomes true", async () => {
    vi.useFakeTimers();
    let ready = false;
    const pending = waitForWidget(() => ready, 1_000);
    ready = true;
    await vi.advanceTimersByTimeAsync(100);
    await expect(pending).resolves.toBeUndefined();
    vi.useRealTimers();
  });

  it("rejects when the condition never holds within the timeout", async () => {
    vi.useFakeTimers();
    const pending = waitForWidget(() => false, 200);
    const assertion = expect(pending).rejects.toThrow("timed out");
    await vi.advanceTimersByTimeAsync(300);
    await assertion;
    vi.useRealTimers();
  });
});
