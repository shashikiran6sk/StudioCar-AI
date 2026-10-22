import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ForkedPlateDetector } from "../../../../../workers/image-processing/src/plate-branding/forked-plate-detector";

const ENTRY = path.resolve(process.cwd(), "../../tests/unit/workers/image-processing/test-support/plate-detector-fixture.mjs");
const image = (value: number) => ({ channels: 3, data: Buffer.alloc(64 * 32 * 3, value), height: 32, width: 64 } satisfies Parameters<ForkedPlateDetector["detect"]>[0]);

describe("isolated plate detector", () => {
  afterEach(() => vi.unstubAllEnvs());
  it("returns validated geometry and never forwards application credentials", async () => {
    vi.stubEnv("LEONARDO_API_KEY", "private-placeholder");
    vi.stubEnv("DATABASE_URL", "private-placeholder");
    await expect(new ForkedPlateDetector(ENTRY, 2000).detect(image(0))).resolves.toEqual([
      { height: 0.1, left: 0.4, score: 0.12, top: 0.5, width: 0.2 },
    ]);
  });
  it.each([1, 4])("kills a stalled child (mode %i), including one which sends but never exits", async (mode) => {
    const start = performance.now();
    await expect(new ForkedPlateDetector(ENTRY, 150).detect(image(mode))).rejects.toThrow("unavailable");
    expect(performance.now() - start).toBeLessThan(1500);
  });
  it.each([2, 3])("rejects invalid responses and crashes (mode %i)", async (mode) => {
    await expect(new ForkedPlateDetector(ENTRY, 2000).detect(image(mode))).rejects.toThrow("unavailable");
  });
  it("treats a missing native entry as unavailable", async () => {
    await expect(new ForkedPlateDetector(`${ENTRY}.missing`, 2000).detect(image(0))).rejects.toThrow("unavailable");
  });
});
