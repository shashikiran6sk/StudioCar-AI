import { describe, expect, it } from "vitest";

import { mapWithConcurrency } from "../../../../apps/web/src/features/portfolio/map-with-concurrency";

describe("mapWithConcurrency", () => {
  it("keeps results in input order however calls finish", async () => {
    const delays = [30, 5, 15, 0];
    const results = await mapWithConcurrency(delays, 2, (delay, index) =>
      new Promise<number>((resolve) => setTimeout(() => resolve(index), delay)),
    );
    expect(results).toEqual([0, 1, 2, 3]);
  });

  it("never runs more calls at once than the limit", async () => {
    let active = 0;
    let peak = 0;
    await mapWithConcurrency([1, 2, 3, 4, 5, 6], 2, async () => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 1));
      active -= 1;
    });
    expect(peak).toBe(2);
  });

  it("rejects when any call fails", async () => {
    await expect(
      mapWithConcurrency([1, 2], 2, (item) =>
        item === 2 ? Promise.reject(new Error("failed")) : Promise.resolve(item),
      ),
    ).rejects.toThrow("failed");
  });

  it("returns nothing for nothing", async () => {
    await expect(mapWithConcurrency([], 4, () => Promise.resolve(1))).resolves.toEqual([]);
  });
});
