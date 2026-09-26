import { captureException } from "@sentry/node";
vi.mock("@sentry/node", () => ({
  captureException: vi.fn(),
  withScope: (
    callback: (scope: { setTag: (key: string, value: string) => void }) => void,
  ) => callback({ setTag: vi.fn() }),
}));
import { beforeEach, describe, expect, it, vi } from "vitest";

import { handleLifecycleCleanup } from "../../../../apps/web/src/server/lifecycle/handle-lifecycle-cleanup";
import type { LifecycleCleanupApplication } from "../../../../apps/web/src/server/lifecycle/lifecycle-cleanup.types";

const ENDPOINT = "https://app.studiocar.test/api/internal/lifecycle/cleanup";
const TOKEN = "lifecycle-cleanup-token-at-least-32-characters";

function request(token: string): Request {
  return new Request(ENDPOINT, {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
  });
}

describe("handleLifecycleCleanup", () => {
  beforeEach(() => vi.clearAllMocks());
  it("rejects invalid credentials without running cleanup", async () => {
    const cleanup: LifecycleCleanupApplication = { run: vi.fn() };
    const response = await handleLifecycleCleanup(
      request("wrong-token"),
      TOKEN,
      cleanup,
      () => "request-forbidden",
    );

    expect(response.status).toBe(403);
    expect(cleanup.run).not.toHaveBeenCalled();
    expect(captureException).not.toHaveBeenCalled();
  });

  it("returns private aggregate counts and maps storage failures", async () => {
    const cleanup: LifecycleCleanupApplication = {
      run: vi
        .fn()
        .mockResolvedValueOnce({
          sessions: 1,
          oauthChallenges: 2,
          phoneOtpChallenges: 3,
          commandRateLimitEvents: 4,
          total: 10,
        })
        .mockRejectedValueOnce(new Error("database unavailable")),
    };
    const success = await handleLifecycleCleanup(
      request(TOKEN),
      TOKEN,
      cleanup,
    );
    const unavailable = await handleLifecycleCleanup(
      request(TOKEN),
      TOKEN,
      cleanup,
      () => "request-unavailable",
    );

    expect(success.status).toBe(200);
    expect(success.headers.get("cache-control")).toBe("no-store");
    await expect(success.json()).resolves.toMatchObject({ total: 10 });
    expect(unavailable.status).toBe(503);
    expect(captureException).toHaveBeenCalledTimes(1);
  });
});
