import type { useRouter } from "next/navigation";
import { vi } from "vitest";

export function createTestRouter(
  refresh: () => void = vi.fn(),
): ReturnType<typeof useRouter> {
  return {
    back: vi.fn(),
    bfcacheId: "test-route",
    forward: vi.fn(),
    refresh,
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  };
}
